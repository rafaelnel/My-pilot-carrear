/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "402b66900e731ca748771b6fc5e7a068"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "f797e8583726817d7e0b7c6e0cef3ae8"
  }, {
    "url": "pwa-512x512.png",
    "revision": "8f7c61c6c9a288a0f821e35b0cc031f7"
  }, {
    "url": "pwa-192x192.png",
    "revision": "f273c89c6dfddac403a4183c63d17e32"
  }, {
    "url": "index.html",
    "revision": "3c05970c67728baa9377f25e7581a938"
  }, {
    "url": "icon.svg",
    "revision": "d20f17970cfc08cd11175416f62e4c52"
  }, {
    "url": "favicon.svg",
    "revision": "df597a7e2b63e86df9a30f7e26814935"
  }, {
    "url": "favicon.ico",
    "revision": "1600a0cd9b8142b50c78fc125235c268"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "aae31de6869bd759df8ae26f3fda9ca8"
  }, {
    "url": "404.html",
    "revision": "b76609fb0e0d6401eac039b82655b449"
  }, {
    "url": "assets/index-BD8nuehV.js",
    "revision": null
  }, {
    "url": "assets/index-BAbbTJRp.css",
    "revision": null
  }, {
    "url": "assets/aistudio/image_221bf9f8.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "aae31de6869bd759df8ae26f3fda9ca8"
  }, {
    "url": "favicon.ico",
    "revision": "1600a0cd9b8142b50c78fc125235c268"
  }, {
    "url": "favicon.svg",
    "revision": "df597a7e2b63e86df9a30f7e26814935"
  }, {
    "url": "icon.svg",
    "revision": "d20f17970cfc08cd11175416f62e4c52"
  }, {
    "url": "pwa-192x192.png",
    "revision": "f273c89c6dfddac403a4183c63d17e32"
  }, {
    "url": "pwa-512x512.png",
    "revision": "8f7c61c6c9a288a0f821e35b0cc031f7"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "f797e8583726817d7e0b7c6e0cef3ae8"
  }, {
    "url": "manifest.webmanifest",
    "revision": "6f026ec5ec53a1caed9ac4640ac1f177"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
