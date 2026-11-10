# illuminatorbros.com

The website for Illuminator Brothers, Moscow, Idaho's local Christmas light installers. It's a one-page
[Jekyll](https://jekyllrb.com) site that GitHub Pages builds and deploys from `master`.

## Editing content

| What | Where |
| --- | --- |
| Business name, email, phone, address, social handles, service area, form endpoint | `_config.yml` |
| "What's included" service cards | `_data/services.yml` |
| FAQ questions and answers | `_data/faq.yml` |
| Section copy | `_includes/*.html` (one file per section) |
| Section order | `index.html` |
| Styles | `assets/css/main.css` |
| Interactions (menu, snowfall, display designer, estimate form) | `assets/js/main.js` |
| Images | `assets/img/` |

Setting `phone` in `_config.yml` adds "Call" buttons to the navigation, estimate section, and footer.

Estimate requests are sent to [Formspree](https://formspree.io) (`formspree_endpoint` in `_config.yml`).

## Previewing locally

```sh
bundle install
bundle exec jekyll serve
```

Then open <http://127.0.0.1:4000>.
