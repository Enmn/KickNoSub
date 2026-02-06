<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/Enmn/KickNoSub">
    <img src="../logo.png" alt="KickNoSub Logo" width="120" height="120">
  </a>

  <h3 align="center">KickNoSub (Python Tool)</h3>

  <p align="center">
    Extract direct stream URLs from Kick VODs easily with Python.
    <br />
    <a href="https://github.com/Enmn/KickNoSub"><strong>Explore the repository »</strong></a>
    <br />
    <br />
    <a href="https://github.com/Enmn/KickNoSub/issues">Report Bug</a>
    &middot;
    <a href="https://github.com/Enmn/KickNoSub/issues">Request Feature</a>
  </p>
</div>

<!-- GETTING STARTED -->
## Getting Started

Follow these steps to run KickNoSub locally.

### Prerequisites

Make sure you have Python 3.8+ installed.

```sh
py --version
```

### Installation

1. Clone the repository
```sh
git clone https://github.com/Enmn/KickNoSub.git
cd KickNoSub
```

2. Install dependencies
```sh
pip install -r requirements.txt
```

<!-- USAGE -->
## Usage

Run the script:

```sh
py kicknosub.py
```

Example:

```
Enter the Kick video URL: https://kick.com/somechannel/video/abcdef
? Choose video quality: 1080p60
✅ Stream URL found!
https://stream.kick.com/.../playlist.m3u8
```

Play in VLC:

```
Media → Open Network Stream → Paste the URL
```

Download with FFmpeg:

```sh
ffmpeg -i "https://stream.kick.com/.../playlist.m3u8" -c copy output.mp4
```

## Disclaimer
This extension follows the same legal terms as the main project.  
See the root `README.md` for full details.