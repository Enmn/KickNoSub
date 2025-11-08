<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![License: MIT][license-shield]][license-url]
[![Python Version][python-shield]](https://www.python.org/downloads/)

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/Enmn/KickNoSub">
    <img src="logo.png" alt="KickNoSub Logo" width="120" height="120">
  </a>

  <h3 align="center">KickNoSub</h3>

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

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#built-with">Built With</a></li>
    <li><a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#legal-disclaimer">Legal Disclaimer</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

KickNoSub is a Python command-line tool that extracts direct stream URLs from Kick VODs. It’s designed for **educational and research purposes**, showing how video metadata and streaming formats can be programmatically accessed.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With
* [Python](https://www.python.org/)
* [KickApi](https://github.com/Enmn/KickApi)
* [CloudScraper](https://github.com/venomous/cloudscraper)
* [Rich](https://github.com/Textualize/rich)
* [Questionary](https://github.com/tmbo/questionary)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

Follow these steps to run KickNoSub locally.

### Prerequisites

Make sure you have Python 3.8+ installed.

```sh
python --version
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

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE -->
## Usage

Run the script:

```sh
python kicknosub.py
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

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Features

- Extract direct Kick VOD stream URLs
- CLI-based Python tool
- Multiple quality options: 1080p60, 720p60, 480p30, 360p30, 160p30
- Cross-platform: Windows, macOS, Linux
- Safe for educational and research purposes

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Legal Disclaimer

This project is provided strictly **for educational, research, and personal learning purposes only**.  

KickNoSub is a demonstration of how public metadata and stream information can be programmatically accessed from Kick’s platform.  
It is **not designed or intended** to:
- Circumvent subscriber-only restrictions or paywalls.  
- Facilitate piracy, redistribution, or unauthorized downloading of content.  
- Be used in any way that violates [Kick Terms of Service](https://kick.com/terms-of-service) or applicable laws.  

By using this project, you agree that:
- You are solely responsible for your actions and any consequences that result.  
- The authors and contributors assume **no liability** for misuse of this tool.  
- You will comply with all relevant laws, regulations, and platform rules.  

If you enjoy content on Kick, please support the creators by subscribing and engaging through the official platform.  

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Contributions are welcome!  

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Choose an Open Source License](https://choosealicense.com)
* [Img Shields](https://shields.io)
* [GitHub Emoji Cheat Sheet](https://www.webpagefx.com/tools/emoji-cheat-sheet/)
* [Rich Python Library](https://github.com/Textualize/rich)
* [Questionary](https://github.com/tmbo/questionary)
* [KickApi](https://github.com/Enmn/KickApi)
* [Cloud Scraper](https://github.com/venomous/cloudscraper)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/Enmn/KickNoSub.svg?style=for-the-badge
[contributors-url]: https://github.com/Enmn/KickNoSub/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Enmn/KickNoSub.svg?style=for-the-badge
[forks-url]: https://github.com/Enmn/KickNoSub/network/members
[stars-shield]: https://img.shields.io/github/stars/Enmn/KickNoSub.svg?style=for-the-badge
[stars-url]: https://github.com/Enmn/KickNoSub/stargazers
[issues-shield]: https://img.shields.io/github/issues/Enmn/KickNoSub.svg?style=for-the-badge
[issues-url]: https://github.com/Enmn/KickNoSub/issues
[license-shield]: https://img.shields.io/github/license/Enmn/KickNoSub.svg?style=for-the-badge
[license-url]: LICENSE
[python-shield]: https://img.shields.io/badge/python-3.8%2B-blue.svg