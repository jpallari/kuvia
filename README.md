# Kuvia

Kuvia is a simple image gallery for static web sites.
Give it a list of image files, and you've got an image gallery that can be hosted in any web host.

Checkout [this demo page](https://jpallari.github.io/kuvia/example/) for an example of what Kuvia generates.

## Usage

```
usage: kuvia [OPTIONS] [FILE ...]

Options:
 -h, --help         Display this help.
 -o, --output=ARG   File to write the page to. Uses STDOUT if not specified.
 -d, --dir=ARG+     Directories to scan for images.
 -r, --recursive    Recursively scan directories for images.
 -t, --types=ARG    Comma separated list of file types to include in image scanning
 -e, --pattern=ARG+ Patterns for scanning image files
 -p, --prefix=ARG   Prefix to add to each scanned file
 -j, --json=ARG     Custom JSON source for images
     --php          Use PHP to load the list of images.
 -J, --js=ARG+      URLs to custom JavaScript files
 -C, --css=ARG+     URLs to custom CSS files
     --no-min       Disable minimization
```

## Installation

Kuvia can be installed from [npm](https://www.npmjs.com/) using the following command:

```bash
npm install -g kuvia
```

## Usage

Kuvia command line app is used for generating gallery pages.
The app allows customizing what images are shown in the gallery.
For example, a gallery of three images can be created like this:

```bash
kuvia -o gallery.html image1.jpg image2.png directory/image3.gif
```

This creates a file `gallery.html` which loads three images.
The gallery file expects the images to be located relative to where the app was called.
Thus if you move the gallery file the image files should be moved accordingly.
You can also specify a prefix if you know that images won't be located relative to the gallery file.

```bash
kuvia -o gallery.html -p 'http://example.org/gallery/' image1.jpg image2.png directory/image3.gif
```

The gallery will then load the images from these URLs:

```
http://example.org/gallery/image1.jpg
http://example.org/gallery/image2.png
http://example.org/gallery/directory/image3.gif
```

### Scanning directories for images

Specifying each file individually can be tedious, which is why the app can also scan directories for images, and generate a gallery based on the found images:

```bash
kuvia -o gallery.html -d myimages
```

This command scans the `myimages` directory for all the images.
You can also specify multiple directories:

```bash
kuvia -o gallery.html -d berlin -d amsterdam -d london
```

If you wish to scan all of the sub directories as well, you can add the `-r` flag:

```bash
kuvia -o gallery.html -r -d berlin -d amsterdam -d london
```

By default, the app scans the directories for all the `jpg`, `jpeg`, `gif`, and `png` files.
You can change what file types are included in the scan:

```bash
kuvia -o gallery.html -t jpg,png -d myimages
```

You can also specify custom patterns for scanning files:

```bash
kuvia -o gallery.html -e 'berlin/*.jpg' -e 'london/**/*.*(png|gif)'
```

This command scans the `berlin` directory for all the `jpg` files and the `london` directory and its subdirectories for all the `png` and `gif` files.
For more information on the pattern syntax, see [glob documentation](https://github.com/isaacs/node-glob#glob-primer).

All of these options can be used simultaneously:

```bash
kuvia -o gallery.html \
    -p 'http://example.org/gallery/' \
    -t jpg,png -r \
    -d myimages \
    -d amsterdam \
    -e 'berlin/*.jpg' \
    -e 'london/**/*.*(png|gif)' \
    image1.jpg image2.png directory/image3.gif
```

### Using JSON resource as an image source

Instead of specifying a static list of files, a JSON resource can be specified.
When the gallery page is opened, the gallery loads the resource and uses the contents as the image list.
The resource contents must be in JSON array format where each element is a path to an image.
A gallery that uses a JSON resource can be generated using the following command:

```bash
kuvia -o gallery.html -j '/path/to/json/resource'
```

### Using PHP for loading the image list

The app can also generate a PHP gallery page that loads the list of images dynamically.
The PHP page loads the list of images from the directory specified in the `dir` query parameter.
The PHP gallery can be generated using the following command:

```bash
kuvia -o gallery.php --php
```

If the web server also supports htaccess files, the query parameter can be masked using rewrite rules with the help of the following `.htaccess` file.
The file must be placed to the same directory as the gallery file, and the file name in the `.htaccess` file must have the same name as the gallery file.

```
RewriteEngine on
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ gallery.php?dorewrite=1&dir=$1 [L,QSA]
```

### Customizing Kuvia

Additional JavaScript and CSS files can be added to the gallery page using `-J` and `-C` flags.
The specified resources are loaded using stylesheet link and script tags:

```bash
kuvia -o gallery.html -d images \
    -J 'http://example.org/myscript.js' \
    -J '/another/script.js' \
    -C 'http://example.org/style.css' \
    -C '/stylesheets/style.css' \
```

By default, the gallery page is minified to save space.
If you don't want the page to be minified, use the `--no-min` flag:

```bash
kuvia -o gallery.html -d images --no-min
```

## Docker

Alternatively, you can run Kuvia directly using Docker.
Kuvia's Docker images are hosted in [Gitlab](https://gitlab.com/lepovirta/kuvia/container_registry).
Example:

```bash
docker run --rm -it \
    -v $(pwd):/workspace \
    registry.gitlab.com/lepovirta/kuvia \
    -d . -r -o index.html
```

In the example, the current directory is mounted as a volume in the `/workspace` directory in the Docker image.
This is how we can provide pictures for Kuvia to find and produce the gallery HTML to.

The Docker image treats the `/workspace` directory as its current directory, so we can just provide `.` as the directory parameter.
Likewise, since we output the HTML to the `index.html` file, it will appear in the current directory.

## Hacking the source code

You can pull the latest development version from GitHub:

```bash
git clone https://github.com/jpallari/kuvia.git
```

Once you've fetched the source code, you can install the dependencies locally using NPM:

```bash
cd kuvia
npm install
```

The JS source code for the UI can be found from `src` directory.
The main program can be found from the `bin` directory.
The `resources` directory contains the stylesheets and HTML templates.

You can run the local Kuvia app from the `bin` directory to try your changes:

```bash
./bin/kuvia.js -o gallery.html -d myimages
```

## Releasing

To create a new release, run the following commands in the master branch:

```bash
npm version $VERSION
git push
git push --tags
```

## License

2-clause BSD license

See [LICENSE](LICENSE) for further detail.
