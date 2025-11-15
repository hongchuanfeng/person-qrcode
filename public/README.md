# Public Directory

This directory contains static assets for the Personalized QR Code Generator website.

## Directory Structure

```
public/
├── favicon.svg          # Main favicon (SVG format for better quality)
├── manifest.json        # Web app manifest for PWA support
├── images/              # Images directory
│   └── .gitkeep        # Keep this directory in git
└── README.md            # This file
```

## Favicon

The current favicon is `favicon.svg` which works in all modern browsers. 

To add additional favicon formats:
- `favicon.ico` - Traditional favicon (16x16, 32x32, 48x48)
- `apple-touch-icon.png` - iOS home screen icon (180x180px)

## Images

Place your static images in the `images/` directory. These can be referenced in your code like:

```tsx
import Image from 'next/image';

<Image src="/images/logo.png" alt="Logo" width={200} height={200} />
```

Or directly in HTML:
```html
<img src="/images/logo.png" alt="Logo" />
```

## Notes

- All files in this directory are served from the root path `/`
- For example, `public/images/logo.png` is accessible at `/images/logo.png`
- Next.js automatically optimizes images placed in the `public` directory

