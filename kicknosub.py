import os
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

    def get_video_stream_url(self, video_url: str, quality: str) -> str | None:
        """Generate the correct HLS stream URL by checking minutes ±5 and auto-quality."""
        tried_urls = []  # Store all attempted URLs
        try:
            parts = video_url.split("/")
            if len(parts) < 6:
                return None
            channel_name = parts[3]
            video_slug = parts[5]
    
            channel = self.api.channel(channel_name)
            for video in channel.videos:
                if video.uuid == video_slug:
                    thumbnail_url = video.thumbnail["src"]
                    start_time = datetime.strptime(video.start_time, "%Y-%m-%d %H:%M:%S")
                    path_parts = thumbnail_url.split("/")
                    channel_id, video_id = path_parts[4], path_parts[5]
    
                    base_urls = [
                        "https://stream.kick.com/ivs/v1/196233775518",
                        "https://stream.kick.com/3c81249a5ce0/ivs/v1/196233775518",
                        "https://stream.kick.com/0f3cb0ebce7/ivs/v1/196233775518"
                    ]
    
                    for offset in range(-5, 6):
                        adjusted_time = start_time + timedelta(minutes=offset)
    
                        for base in base_urls:
                            if quality.lower() == "auto":
                                url = (
                                    f"{base}/{channel_id}/{adjusted_time.year}/{adjusted_time.month}/"
                                    f"{adjusted_time.day}/{adjusted_time.hour}/{adjusted_time.minute}/"
                                    f"{video_id}/media/hls/master.m3u8"
                                )
                            else:
                                url = (
                                    f"{base}/{channel_id}/{adjusted_time.year}/{adjusted_time.month}/"
                                    f"{adjusted_time.day}/{adjusted_time.hour}/{adjusted_time.minute}/"
                                    f"{video_id}/media/hls/{quality}/playlist.m3u8"
                                )
                            
                            tried_urls.append(url)  # Save URL
                            try:
                                res = self.session.head(url, timeout=5)
                            except Exception:
                                continue
    
                            if res.status_code == 200:
                                self.console.print(f"[green]✅ Found valid stream at offset {offset} minute(s)[/green]")
                                return url

                    self.console.print("[red]❌ Could not find a valid stream within ±5 minutes.[/red]")
                    return None
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
                filename = questionary.text("Enter output filename (with .mp4):").ask()
                self.download_video(stream_url, filename)
            else:
                install = questionary.confirm("FFmpeg not found. Do you want to install it now?").ask()
                if install:
                    self.install_ffmpeg()
                    if self.ffmpeg_exists():
                        filename = questionary.text("Enter output filename (with .mp4):").ask()
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