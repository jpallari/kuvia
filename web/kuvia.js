//
// Logger
//

function log(...args) {
  if (window.console && window.console.log) {
    // console is not always available in some browsers
    console.log(...args);
  }
}

//
// DOM tools
//

const dom = (() => {
  const self = {};

  function byId(id) {
    return window.document.getElementById(id);
  }

  function mapForKeys(items, cb) {
    const obj = {};
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      obj[item] = cb(item);
    }
    return obj;
  }

  function byIds(ids) {
    return mapForKeys(ids, byId);
  }

  function byClass(className) {
    return window.document.getElementsByClassName(className);
  }

  function onLoad(fun) {
    const doc = window.document;
    const retry = () => {
      onLoad(fun);
    };
    if (/in/.test(doc.readyState)) {
      window.setTimeout(retry, 9, false);
    } else {
      fun();
    }
  }

  function noModifiers(e) {
    return !e.ctrkKey && !e.shiftKey && !e.altKey && !e.metaKey;
  }

  function onEvent(obj, evname, fun) {
    const handler = (e) => {
      const r = fun(e);
      if (r !== true) {
        e.preventDefault();
      }
    };
    if (obj instanceof NodeList) {
      [...obj].forEach((el) => {
        el.addEventListener(evname, handler, false);
      });
    } else {
      obj.addEventListener(evname, handler, false);
    }
  }

  function onKeyDown(handlermap) {
    onEvent(window, 'keydown', (e) => {
      const handler = handlermap[e.keyCode];
      if (typeof handler === 'function' && noModifiers(e)) {
        return handler(e);
      }
      return true;
    });
  }

  function removeCssClassPrefix(element, cssClassPrefix) {
    const cssClassesToRemove = [];
    element.classList.forEach((cssClass) => {
      if (cssClass.startsWith(cssClassPrefix)) {
        cssClassesToRemove.push(cssClass);
      }
    });
    cssClassesToRemove.forEach((cssClass) =>
      element.classList.remove(cssClass),
    );
  }

  function hide(element) {
    if (element) {
      element.style.display = 'none';
    }
  }

  function show(element, displayType) {
    if (element) {
      element.style.display = displayType || 'inline';
    }
  }

  function clearNode(node) {
    while (node.hasChildNodes()) {
      node.removeChild(node.lastChild);
    }
  }

  function setChild(parent, child) {
    clearNode(parent);
    parent.appendChild(child);
  }

  self.byClass = byClass;
  self.byId = byId;
  self.byIds = byIds;
  self.clearNode = clearNode;
  self.element = (el) => window.document.createElement(el);
  self.fragment = () => window.document.createDocumentFragment();
  self.getHashLocation = () => window.location.hash.substring(1);
  self.hide = hide;
  self.onEvent = onEvent;
  self.onKeyDown = onKeyDown;
  self.onLoad = onLoad;
  self.removeCssClassPrefix = removeCssClassPrefix;
  self.setChild = setChild;
  self.setHashLocation = (l) => {
    window.location.assign(`#${l}`);
  };
  self.show = show;
  self.text = (s) => window.document.createTextNode(s);

  return self;
})();

//
// Image
//

function createTextFromSrc(src) {
  return decodeURI(src.substring(src.lastIndexOf('/') + 1, src.length));
}

function createTextLink(text) {
  const link = dom.element('a');
  link.href = '#';
  link.appendChild(dom.text(text));
  link.title = text;
  return link;
}

function createImageElement(onclick, onerror) {
  const img = dom.element('img');
  img.onclick = onclick;
  img.onerror = () => {
    img.onerror = undefined; // Ensure onerror is called only once
    onerror();
  };
  return img;
}

class Image {
  src;
  text;
  image;
  link;

  constructor(src, onclick, onerror) {
    this.src = src;
    this.text = createTextFromSrc(src);
    this.image = createImageElement(onclick, onerror.bind(this, this));
    this.link = createTextLink(this.text);
  }
  loadImage() {
    if (this.image.src !== this.src) {
      this.image.src = this.src;
    }
  }

  hide() {
    this.image.classList.remove('show');
    this.link.classList.remove('show');
  }

  show() {
    this.loadImage();
    this.image.classList.add('show');
    this.link.classList.add('show');
  }

  setImageOnClick(handler) {
    this.image.onclick = handler;
  }

  addLinkOnClick(handler) {
    dom.onEvent(this.link, 'click', handler);
  }

  removeElements() {
    this.image.remove();
    this.link.remove();
  }
}

//
// Display
//

function callEach(items, ...args) {
  return items.map((item) => item(...args)).every((v) => v === true);
}

const elementIds = [
  'imginfo',
  'imgarea',
  'linksarea',
  'sidebar',
  'zoomindicator',
];

function createListElement(element) {
  const listElement = dom.element('li');
  listElement.appendChild(element);
  return listElement;
}

function addClickHandler(element, handler) {
  const _addClickHandler = (el) => {
    dom.onEvent(el, 'click', handler);
  };

  if (element instanceof HTMLCollection) {
    [...element].forEach(_addClickHandler);
  } else {
    _addClickHandler(element);
  }
}

class Display {
  _elements = {};
  _nextHandlers = [];
  _previousHandlers = [];
  _zoomHandlers = [];

  _addClassClickHandlers(handlers) {
    for (const h of handlers) {
      addClickHandler(dom.byClass(h[0]), h[1]);
    }
  }

  _toggleSidebar() {
    this._elements.sidebar.classList.toggle('show');
  }

  setImageInfoHtml(html) {
    this._elements.imginfo.innerHTML = html;
  }

  setImages(images) {
    const linksareaFragment = dom.fragment();
    const imgareaFragment = dom.fragment();

    for (const image of images) {
      linksareaFragment.appendChild(createListElement(image.link));
      imgareaFragment.appendChild(image.image);
    }

    dom.setChild(this._elements.linksarea, linksareaFragment);
    dom.setChild(this._elements.imgarea, imgareaFragment);
  }

  showNoImagesWarning() {
    const warning = dom.byId('noimageswarning');
    dom.show(warning, 'block');
  }

  hideNoImagesWarning() {
    const warning = dom.byId('noimageswarning');
    dom.hide(warning);
  }

  setZoom(zoomMode) {
    dom.removeCssClassPrefix(this._elements.imgarea, 'zoom');
    this._elements.imgarea.classList.add(`zoom-${zoomMode}`);
    dom.removeCssClassPrefix(this._elements.zoomindicator, 'zoom-ind');
    this._elements.zoomindicator.classList.add(`zoom-ind-${zoomMode}`);
  }

  setImageLocation(location) {
    dom.setHashLocation(location);
  }

  addNextHandler(...handlers) {
    this._nextHandlers.push(...handlers);
  }

  addPreviousHandler(...handlers) {
    this._previousHandlers.push(...handlers);
  }

  addZoomHandler(...handlers) {
    this._zoomHandlers.push(...handlers);
  }

  initialize() {
    const callNextHandlers = callEach.bind(null, this._nextHandlers);
    const callPreviousHandlers = callEach.bind(null, this._previousHandlers);
    const callZoomHandlers = callEach.bind(null, this._zoomHandlers);
    this._elements = dom.byIds(elementIds);
    this._addClassClickHandlers([
      ['next_image', callNextHandlers.bind(null, false)],
      ['previous_image', callPreviousHandlers.bind(null, false)],
      ['toggle_sidebar', this._toggleSidebar.bind(this)],
      ['toggle_zoom', callZoomHandlers],
    ]);
    dom.onKeyDown({
      32: this._toggleSidebar.bind(this),
      75: callPreviousHandlers.bind(null, false),
      74: callNextHandlers.bind(null, false),
      37: callPreviousHandlers.bind(null, true),
      39: callNextHandlers.bind(null, true),
      90: callZoomHandlers,
    });
  }
}

//
// State list
//

class StateList {
  currentIndex = 0;
  isHashAvailable = false;
  hashFunction = undefined;
  list = [];
  indexByKey = undefined;

  constructor(listItems, hashFunction) {
    this.currentIndex = 0;
    this.isHashAvailable = typeof hashFunction === 'function';
    this.hashFunction = hashFunction;
    this.setList(listItems);
  }

  _isIndexOutOfBounds(index) {
    return Number.isNaN(index) || index < 0 || index > this.lastIndex();
  }

  _isValidIndex(index) {
    return typeof index === 'number' && !this._isIndexOutOfBounds(index);
  }

  _updateCurrentKey() {
    if (!this.isHashAvailable) {
      return;
    }
    const item = this.currentItem();
    if (item) {
      this.currentKey = this.hashFunction(item);
    }
  }

  _setIndex(index, fallback) {
    if (this._isValidIndex(index)) {
      this.currentIndex = index;
    } else {
      this.currentIndex = this._isValidIndex(fallback) ? fallback : 0;
    }
    this._updateCurrentKey();
    return this.currentItem();
  }

  _refreshKeyIndex() {
    this.indexByKey = Object.create(null);
    if (!this.isHashAvailable) {
      return;
    }
    this.list.forEach((item, index) => {
      const key = this.hashFunction(item);
      this.indexByKey[key] = index;
    });
  }

  _getByKey(key) {
    if (!this.isHashAvailable) {
      throw new Error("Can't get by ID. No hash function set for state list!");
    }
    return this.indexByKey[key];
  }

  _getByItem(item) {
    return this._getByKey(this.hashFunction(item));
  }

  _removeByIndex(index) {
    this.list.splice(index, 1);
    this._refreshKeyIndex();
    return this._setIndex(this.currentIndex, this.lastIndex());
  }

  setList(items) {
    this.list = items;
    this._setIndex(0, 0);
    this._refreshKeyIndex();
  }

  currentItem() {
    return this.list[this.currentIndex];
  }

  next() {
    return this._setIndex(this.currentIndex + 1, 0);
  }

  lastIndex() {
    return this.list.length - 1;
  }

  previous() {
    return this._setIndex(this.currentIndex - 1, this.lastIndex());
  }

  setCurrentItem(item) {
    const index = this._getByItem(item);
    return this.setCurrentIndex(index);
  }

  setCurrentId(id) {
    const index = this._getByKey(id);
    return this.setCurrentIndex(index);
  }

  setCurrentIndex(index) {
    return this._setIndex(index, this.currentIndex);
  }

  removeItem(item) {
    const index = this._getByItem(item);
    if (typeof index === 'number') {
      return this._removeByIndex(index);
    }
    return null;
  }
}

//
// Gallery
//

class Gallery {
  _images;
  _zoom;
  _display;
  _imageFactory;
  _imageHashFunction;

  constructor(display, imageFactory) {
    this._imageHashFunction = (image) => image.src;
    this._display = display;
    this._imageFactory = imageFactory;
    this._images = new StateList([], this._imageHashFunction);
    this._zoom = new StateList(['min', 'med', 'max']);

    this._display.addNextHandler(this.next.bind(this));
    this._display.addPreviousHandler(this.previous.bind(this));
    this._display.addZoomHandler(this.setNextZoom.bind(this));
  }

  _setNoImagesWarning(visible) {
    if (visible) {
      this._display.showNoImagesWarning();
    } else {
      this._display.hideNoImagesWarning();
    }
  }

  _currentImage() {
    return this._images.currentItem();
  }

  _hideCurrentImage() {
    const image = this._currentImage();
    if (image) {
      image.hide();
    }
  }

  _imageInfoText() {
    const current = this._images.currentIndex + 1;
    const last = this._images.lastIndex() + 1;
    const image = this._images.currentItem();
    const imageText = image ? image.text : '';
    return `${current}/${last} - ${imageText}`;
  }

  _setImageInfo(noLocationUpdate) {
    const image = this._currentImage();
    if (image && !noLocationUpdate) {
      this._display.setImageLocation(this._imageHashFunction(image));
    }
    this._display.setImageInfoHtml(this._imageInfoText());
  }

  _updateImage(f, noLocationUpdate) {
    this._hideCurrentImage();
    f().show();
    this._setImageInfo(noLocationUpdate);
  }

  _showImage(image) {
    const self = this;
    this._updateImage(() => self._images.setCurrentItem(image));
  }

  _createImages(urls) {
    const self = this;
    const createImage = (url) => {
      const image = self._imageFactory(
        url,
        self.setNextZoom.bind(self),
        self.invalidImage.bind(self),
      );
      image.addLinkOnClick(() => {
        self._showImage(image);
      });
      return image;
    };

    return urls.map(createImage);
  }

  _isMaxZoom() {
    return this._zoom.currentItem() === 'max';
  }

  invalidImage(image) {
    const nextImage = this._images.removeItem(image);
    if (image) {
      log('Invalid or missing image: ', image.src);
      image.removeElements();
    }
    if (nextImage) {
      this._showImage(nextImage);
    }
  }

  next(checkZoom) {
    if (checkZoom && this._isMaxZoom()) {
      return true;
    }

    const self = this;
    return this._updateImage(() => self._images.next());
  }

  previous(checkZoom) {
    if (checkZoom && this._isMaxZoom()) {
      return true;
    }

    const self = this;
    return this._updateImage(() => self._images.previous());
  }

  setNextZoom() {
    this._display.setZoom(this._zoom.next());
  }

  setIndex(index) {
    const self = this;
    this._updateImage(
      () => self._images.setCurrentIndex(index),
      this._images.currentIndex === index,
    );
  }

  setById(id) {
    const self = this;
    this._updateImage(
      () => self._images.setCurrentId(id),
      this._images.currentKey === id,
    );
  }

  initialize(urls, selectedImage) {
    this._setNoImagesWarning(urls.length === 0);
    this._images.setList(this._createImages(urls));
    this._display.setImages(this._images.list);
    this._display.setZoom(this._zoom.currentItem());

    if (typeof selectedImage === 'number') {
      this.setIndex(selectedImage);
    } else if (typeof selectedImage === 'string') {
      this.setById(selectedImage);
    }
  }
}

//
// Main
//

if (typeof window === 'undefined') {
  // Running headless
  exports.StateList = StateList;
} else {
  // Running in browser
  function imageFactory(src, onclick, onerror) {
    return new Image(src, onclick, onerror);
  }

  const display = new Display();
  const gallery = new Gallery(display, imageFactory);

  function getImageHash() {
    return dom.getHashLocation();
  }

  function loadGallery(images) {
    display.initialize();
    gallery.initialize(images, getImageHash());
    window['kuvia'] = gallery;
  }

  function loadAjaxGallery(url) {
    fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load images list from ${url}`);
      }
      loadGallery(response.json());
    });
  }

  dom.onLoad(() => {
    const images = window['kuviaimagelist'];

    if (typeof images === 'string') {
      loadAjaxGallery(images);
    } else if (images && images.length > 0) {
      loadGallery(images);
    } else {
      loadGallery([]);
    }
  });

  dom.onEvent(window, 'hashchange', () => {
    gallery.setById(getImageHash());
  });
}
