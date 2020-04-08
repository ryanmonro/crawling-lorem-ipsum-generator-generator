#! /usr/bin/env node

var fs        = require("fs")
var url       = require("url")
var spawn     = require("cross-spawn")
var path      = require("path")
var Mercury   = require("@postlight/mercury-parser")
var markov    = require("markov")
var slugify   = require("slugify")
var commander = require("commander")
var inquirer  = require("inquirer")
var axios     = require("axios")
var cheerio   = require('cheerio')

var program = new commander.Command('lorem-ipsum-generator-generator')
  .version("1.0.0")
  .usage('<urls ...> [options]')
  .option('-p, --project-name [name]')
  .option('-l, --logo [logo]')
  .option('-b, --background [background]')
  .option('-a, --accent [accent]')
  .parse(process.argv)

var options = {
  name:       program.projectName,
  logo:       program.logo,
  background: program.background,
  accent:     program.accent,
  urls:       program.args,
  crawlPath:  "",
  crawlMax:   100
}

run()

async function run() {
  if (!options.name) {
    await ask()
  }
  if (options.urls.length === 0) {
    await askUrls()
  }
  if (options.crawl) {
    await crawl()
  }
  generate()
}

async function ask() {
  var answers = await inquirer.prompt([
    {
      type:     'input',
      name:     'name',
      message:  'Name of your generator:',
      default:  options.name,
      validate: Boolean
    },
    {
      type:    'input',
      name:    'logo',
      message: '(Optional) URL of a logo image:',
      default: options.logo
    },
    {
      type:    'input',
      name:    'background',
      message: '(Optional) URL of a background image:',
      default: options.background
    },
    {
      type:    'input',
      name:    'accent',
      message: '(Optional) Accent color (hex, rgb, named color, whatever):',
      default: options.accent
    },
    {
      type:    'confirm',
      name:    'crawl',
      message: 'Crawl source site for more URLs?',
      default: false
    }
  ])

  options.name       = answers.name
  options.logo       = answers.logo
  options.background = answers.background
  options.accent     = answers.accent
  options.crawl      = answers.crawl
}



async function askUrls() {
  var answers = await inquirer.prompt([
    {
      type:    'input',
      name:    'url',
      message: 'URL of a source for your generator:'
    }
  ])

  if (options.crawl) {
    var crawlingAnswers = await inquirer.prompt([
      {
        type:    'number',
        name:    'crawlMax',
        message: 'Maximum number of pages to crawl:',
        default: 10
      },
      {
        type:    'input',
        name:    'crawlPath',
        message: 'Path on :',
        default: ''
      }
    ])
    options.crawlMax = crawlingAnswers.crawlMax
    options.crawlPath = crawlingAnswers.crawlPath
  } else {
    var addUrl = await inquirer.prompt([
      {
        type:    'confirm',
        name:    'addUrl',
        message: 'Add another source?',
        default: true
      }
    ])
    answers.addUrl = addUrl.addUrl
  }

  options.urls.push(answers.url)
  if (answers.addUrl) {
    await askUrls()
  }
}

async function generate() {
  var name   = slugify(options.name, {lower: true})
  var root   = path.resolve(name)
  var corpus = await fetchText(options.urls)

  if (!corpus) {
    console.log('Mercury couldn’t find any usable text at your sources.')
    process.exit()
  }

  if (fs.existsSync(root)) {
    console.log(`A folder with the name ${name} already exists. We don't want to overwrite that!`)
    process.exit()
  }

  fs.mkdirSync(root);
  fs.mkdirSync(path.join(root, 'functions'))
  fs.mkdirSync(path.join(root, 'functions/generate'))

  var files = [
    'postlight-labs.gif',
    'functions/generate/generate.js',
    'functions/generate/package.json'
  ]
  files.forEach(f => fs.copyFileSync(path.join(__dirname, f), path.join(root, f)))
  writeDb(corpus)

  var packageJson = {
    name,
    version: '1.0.0',
    private: true,
    description: 'A lorem ipsum generator based on text found by Mercury Parser',
    scripts: {
      deploy: './node_modules/.bin/netlify deploy --prod --open'
    },
    dependencies: {
      "netlify-cli": "2.8.3"
    }
  }
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(packageJson, null, 2))

  var index = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
  var updatedIndex = index.replace(/My Ipsum/g, options.name)
  if (options.logo) {
    updatedIndex = updatedIndex.replace(/<!-- LOGO -->/g, `<img id="logo" src="${options.logo}" alt="" />`)
  }
  if (options.background) {
    updatedIndex = updatedIndex.replace(/dimgray/g, `url('${options.background}')`)
  }
  if (options.accent) {
    updatedIndex = updatedIndex.replace(/#111111/g, options.accent)
  }
  fs.writeFileSync(path.join(root, 'index.html'), updatedIndex)

  process.chdir(root)
  var npmInstall = spawn.sync('npm', ['install'], { stdio: 'inherit' })

  process.chdir(path.join(root, 'functions/generate'))
  var npmInstallFunc = spawn.sync('npm', ['install'], { stdio: 'inherit' })

  process.chdir(root)
  var netlifyDeploy = spawn.sync(
    './node_modules/.bin/netlify',
    ['deploy', '--prod', '--open', '--functions', 'functions'],
    { stdio: 'inherit' }
  )

  return true

  function writeDb(corpus) {
    var m = markov(2)
    m.seed(corpus, () => {
      fs.writeFileSync(path.join(root, 'functions/generate/db.json'), JSON.stringify(m.getDb()))
    })
  }
}

async function crawl(){
  var urlIndex = 0
  var firstUrl = options.urls[0]
  while (options.urls.length < options.crawlMax){
    try {
      var response = await axios.get(options.urls[urlIndex])
      var $ = cheerio.load(response.data)
      $('a').each(function (i, a) {
        var href = a.attribs.href
        if (href && 
          !options.urls.includes(href) && 
          href.startsWith(url.resolve(firstUrl, options.crawlPath)) && 
          options.urls.length < options.crawlMax){
            options.urls.push(href)
        } 
      })
    } catch (error) {
      console.error("Error fetching url " + firstUrl)
    }
    urlIndex++;
  }
}

async function fetchText(urls = []) {
  var contents = urls.map(async u => {
    var res = await Mercury.parse(u, {contentType: 'text'})
    return res.content.trim()
  })

  return Promise.all(contents).then(c => c.join(''))
}
