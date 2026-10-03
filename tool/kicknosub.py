import os
import re
import sys
import platform
import shutil
import subprocess
from datetime import datetime
from kickapi import KickAPI
from rich.console import Console
from rich.panel import Panel
import questionary
import cloudscraper
from datetime import timedelta

class KickNoSub:
    def __init__(self):
        self.console = Console()
        self.session = cloudscraper.CloudScraper()
        self.api = KickAPI()
        self.os_name = platform.system()
        self.ffmpeg_local_path = os.path.join(
            os.path.dirname(__file__), 
            "ffmpeg", 
            "ffmpeg.exe" if self.os_name == "Windows" else "ffmpeg"
        )

    def ffmpeg_exists(self):
        """Check if FFmpeg exists in PATH or local project folder."""
        return shutil.which("ffmpeg") is not None or os.path.exists(self.ffmpeg_local_path)

    def install_ffmpeg(self):
        """Install FFmpeg depending on the operating system."""
        if self.os_name == "Linux":
            self.console.print("[yellow]Attempting to install FFmpeg using apt...[/yellow]")
            try:
                subprocess.run(["sudo", "apt", "update"], check=True)
                subprocess.run(["sudo", "apt", "install", "-y", "ffmpeg"], check=True)
                self.console.print("[green]FFmpeg installed successfully![/green]")
            except Exception as e:
                self.console.print(f"[red]Failed to install FFmpeg:[/red] {e}")

        elif self.os_name == "Darwin":
            self.console.print("[yellow]Attempting to install FFmpeg using Homebrew...[/yellow]")
            try:
                subprocess.run(["brew", "install", "ffmpeg"], check=True)
                self.console.print("[green]FFmpeg installed successfully![/green]")
            except Exception as e:
                self.console.print(f"[red]Failed to install FFmpeg:[/red] {e}")

        elif self.os_name == "Windows":
            self.console.print("[yellow]Checking if winget is available...[/yellow]")
            if shutil.which("winget"):
                try:
                    self.console.print("[yellow]Installing FFmpeg using winget...[/yellow]")
                    subprocess.run(["winget", "install", "ffmpeg"], check=True)
                    self.console.print("[green]FFmpeg installed successfully![/green]")
                    self.console.print("[yellow]Please restart CMD or PowerShell to use FFmpeg.[/yellow]")
                except Exception as e:
                    self.console.print(f"[red]Failed to install FFmpeg via winget:[/red] {e}")
            else:
                self.console.print("[red]winget not found![/red]")
                self.console.print("[yellow]Please install winget or download ffmpeg.exe manually from https://www.gyan.dev/ffmpeg/builds/[/yellow]")

    def _parse_start_time(self, raw: str) -> datetime:
        """Accept 'YYYY-MM-DD HH:MM:SS' and ISO8601 'YYYY-MM-DDTHH:MM:SSZ'."""
        raw = (raw or "").strip()
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S.%fZ"):
            try:
                dt = datetime.strptime(raw, fmt)
                return dt.replace(tzinfo=None)  # naive, same as before (stream path uses wall time)
            except ValueError:
                continue
        # last resort: fromisoformat
        try:
            dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            return dt.replace(tzinfo=None)
        except Exception:
            raise ValueError(f"Unrecognized start_time format: {raw}")

    def _normalize_quality(self, quality: str) -> str:
        q = (quality or "").strip().lower()
        aliases = {
            "auto": "auto", "1080p": "1080p60", "720p": "720p60",
            "480p": "480p30", "360p": "360p30", "160p": "160p30",
        }
        return aliases.get(q, quality)

    def _metadata_from_page(self, video_url: str) -> tuple[str, str, datetime] | tuple[None, None, None]:
        """Fallback for videos not listed in channel API (e.g. sub_only).

        Parses the Next.js dehydrated state embedded in the video page HTML:
        thumbnail src -> channel_id / video_id, start_time -> stream path time.
        """
        try:
            resp = self.session.get(video_url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code != 200:
                return None, None, None
            html = resp.text
            thumb_m = re.search(
                r'https://images\.kick\.com/video_thumbnails/([^/\\"]+)/([^/\\"]+)/\d+\.webp',
                html,
            )
            time_m = re.search(r'start_time[^0-9]+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)', html)
            if not thumb_m or not time_m:
                return None, None, None
            channel_id, video_id = thumb_m.group(1), thumb_m.group(2)
            start_time = self._parse_start_time(time_m.group(1))
            return channel_id, video_id, start_time
        except Exception:
            return None, None, None

    def _probe_stream(self, channel_id: str, video_id: str, start_time: datetime, quality: str) -> str | None:
        """Probe stream.kick.com with minutes ±5 across known base URLs."""
        quality = self._normalize_quality(quality)
        base_urls = [
            "https://stream.kick.com/ivs/v1/196233775518",
            "https://stream.kick.com/3c81249a5ce0/ivs/v1/196233775518",
            "https://stream.kick.com/0f3cb0ebce7/ivs/v1/196233775518",
        ]
        for offset in range(-5, 6):
            adjusted = start_time + timedelta(minutes=offset)
            for base in base_urls:
                if quality.lower() == "auto":
                    url = (
                        f"{base}/{channel_id}/{adjusted.year}/{adjusted.month}/"
                        f"{adjusted.day}/{adjusted.hour}/{adjusted.minute}/"
                        f"{video_id}/media/hls/master.m3u8"
                    )
                else:
                    url = (
                        f"{base}/{channel_id}/{adjusted.year}/{adjusted.month}/"
                        f"{adjusted.day}/{adjusted.hour}/{adjusted.minute}/"
                        f"{video_id}/media/hls/{quality}/playlist.m3u8"
                    )
                try:
                    res = self.session.head(url, timeout=5)
                except Exception:
                    continue
                if res.status_code == 200:
                    self.console.print(f"[green]✅ Found valid stream at offset {offset} minute(s)[/green]")
                    return url
        self.console.print("[red]❌ Could not find a valid stream within ±5 minutes.[/red]")
        return None

    def get_video_stream_url(self, video_url: str, quality: str) -> str | None:
        """Resolve VOD metadata then probe for the HLS URL."""
        try:
            if not video_url or not quality:
                return None
            parts = video_url.split("/")
            if len(parts) < 6:
                return None
            channel_name = parts[3]
            video_slug = parts[5]

            # 1) Try public channel API (fast path for public VODs)
            try:
                channel = self.api.channel(channel_name)
                for video in getattr(channel, "videos", []) or []:
                    if getattr(video, "uuid", None) == video_slug:
                        thumbnail_url = video.thumbnail["src"]
                        start_time = self._parse_start_time(video.start_time)
                        path_parts = thumbnail_url.split("/")
                        channel_id, video_id = path_parts[4], path_parts[5]
                        found = self._probe_stream(channel_id, video_id, start_time, quality)
                        if found:
                            return found
                        break
            except Exception:
                pass

            # 2) Fallback: parse video page HTML (works for sub_only VODs
            #    missing from channel API, e.g. .../videos/01a09728-...)
            channel_id, video_id, start_time = self._metadata_from_page(video_url)
            if channel_id and video_id and start_time:
                return self._probe_stream(channel_id, video_id, start_time, quality)
            return None
        except Exception as e:
            self.console.print(f"[red]Error:[/red] {e}")
            return None

    def download_video(self, stream_url: str, filename: str):
        """Download the video using FFmpeg."""
        ffmpeg_path = shutil.which("ffmpeg") or self.ffmpeg_local_path
        if not os.path.exists(ffmpeg_path):
            self.console.print("[red]FFmpeg executable not found![/red]")
            return
        try:
            subprocess.run([ffmpeg_path, "-i", stream_url, "-c", "copy", filename], check=True)
            self.console.print(f"[green]✅ Download completed: {filename}[/green]")
        except Exception as e:
            self.console.print(f"[red]Download failed:[/red] {e}")

    def run(self):
        """Main program loop."""
        video_url = questionary.text("Enter the Kick video URL:").ask()
        quality = questionary.select(
            "Choose video quality:",
            choices=["Auto", "1080p60", "720p60", "480p30", "360p30", "160p30"]
        ).ask()

        stream_url = self.get_video_stream_url(video_url, quality)

        if not stream_url:
            self.console.print("[red]❌ Video not found or stream URL could not be retrieved.[/red]")
            sys.exit()

        download = questionary.confirm("Do you want to download it as MP4?").ask()

        if download:
            if self.ffmpeg_exists():
                filename = questionary.text("Enter output filename:").ask() + ".mp4"
                self.download_video(stream_url, filename)
            else:
                install = questionary.confirm("FFmpeg not found. Do you want to install it now?").ask()
                if install:
                    self.install_ffmpeg()
                    if self.ffmpeg_exists():
                        filename = questionary.text("Enter output filename:").ask() + ".mp4"
                        self.download_video(stream_url, filename)
                    else:
                        self.console.print("[yellow]FFmpeg still not available. Showing stream URL instead.[/yellow]")
                        self.console.print(Panel(stream_url, style="bright_blue"))
                else:
                    self.console.print("[yellow]FFmpeg not installed. Showing stream URL instead.[/yellow]")
                    self.console.print(Panel(stream_url, style="bright_blue"))
        else:
            self.console.print("\n[bold green]✅ Stream URL:[/bold green]")
            self.console.print(Panel(stream_url, style="bright_blue"))

if __name__ == "__main__":
    app = KickNoSub()
    app.run()