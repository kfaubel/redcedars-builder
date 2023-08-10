# redcedars-builder
Module for building a jpeg image with data from an Ambient Weather station.

Requires a URL from AmbientWeather.net
See: https://github.com/ambient-weather/api-docs/wiki/Device-Data-Specs
See: https://ambientweather.docs.apiary.io/#introduction/helper-libraries

This module just uses axios to pull the REST data since it does not need to update in real time.

test.ts shows how to use the module

The normal use of this module is to build an npm module that can be used as part of a bigger progress.

index.d.ts describes the interface for the module

The LoggerInterface, KacheInterface and ImageWriterInterface interfaces are dependency injected into the module.  Simple versions are provided and used by the test wrapper.

Once instanciated, the CreateImages() method can be called to create the image.

To use the test wrapper to build a screen, run the following command.  
```
$ npm start

or

$ node app.js 
```