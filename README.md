# Crawling Lorem Ipsum Generator Generator

## Crawling!
This fork of the Lorem Ipsum Generator Generator adds webcrawling, to allow the Markov chain to be trained by the content of multiple pages from a target site. Usage is the same as the original generator, but you will be prompted for options about crawling. It can be run from the command line after cloning this repo with `node cli.js`. 

[Here](https://crawlspace.netlify.com/) is an example generated from crawling 100 articles from Myspace. The original readme continues below.

## Original Readme:
[Postlight](https://postlight.com)'s Lorem Ipsum Generator Generator creates a lorem ipsum generator site from any content on the web using [Mercury Parser](https://mercury.postlight.com). Read all about it in [this handy introduction](https://postlight.com/trackchanges/introducing-postlights-lorem-ipsum-generator-generator).

## Before you install

1. Install [node](https://nodejs.org).
2. [Create a Netlify account](https://app.netlify.com/signup).
3. Gather one or more URLs to use as the corpus for your lorem ipsum generator.

## Installation

```shell
$ npx @postlight/lorem-ipsum-generator-generator
```

and follow the prompts.

or

```shell
$ npx @postlight/lorem-ipsum-generator-generator \
  http://example.com \
  https://postlight.com/trackchanges/mercury-goes-open-source \
  --project-name "My Ipsum" \
  --logo https://placekitten.com/300/300 \
  --background https://placekitten.com/800/600 \
  --accent "#facade"
```

The generator will create a folder for your project, install the necessary node
packages, and kick off `netlify-cli` to deploy it to the web. The first time you
use the generator, you'll be asked to authorize it to connect to your Netlify
account.

If you're not connecting it to an existing Netlify site, choose `Create &
configure a new site`, and feel free to accept the defaults for the rest of the
propmpts (everything can be changed later in Netlify's site settings pages).

Once the deploy succeeds, your new lorem ipsum generator will open in your
default browser. Enjoy!

## Hit the endpoint directly

Your generator is powered by a function that accepts GET requests at
`https://[your site id].netlify.com/.netlify/functions/generate`.

It accepts URL parameters for the number of paragraphs:
`https://fyreipsum.com/.netlify/functions/generate?paragraphs=3`

...or the number of words to return in a single paragraph:
`https://fyreipsum.com/.netlify/functions/generate?words=25`

and returns a JSON object with an array of paragraphs under the key `paragraphs`.

## Customization

Feel free to customize your site and re-deploy it at will. All the styles and
behavior live in your site directory's `index.html`, including some social meta
tags you can update if you wire up your site to a domain name.

The Netlify function that generates the lorem ipsum text is created in the
`functions/generate` folder. It's small and easy to change, if you want
different defaults!

To re-deploy after your customizations, run `npm run deploy`.

## License

Licensed under either of the below, at your preference:

- Apache License, Version 2.0
  ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license
  ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

## Contributing

For details on how to contribute, see [CONTRIBUTING.md](./CONTRIBUTING.md)

Unless it is explicitly stated otherwise, any contribution intentionally
submitted for inclusion in the work, as defined in the Apache-2.0 license,
shall be dual licensed as above without any additional terms or conditions.

---

🔬 A Labs project from your friends at [Postlight](https://postlight.com). Happy coding!

