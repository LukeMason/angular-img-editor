(function() {
    'use strict';
    /* 
  Luke Mason 2014
  Angular directives which use Canvas to provide an editable context for images.
  Jcrop, used for cropping http://deepliquid.com/content/Jcrop.html
*/

    /*Convert a file in the scope into an img src data attribute*/
    angular.module('imgEditor.directives', [])
        .directive('imgData', [

            function() {
                return {
                    restrict: 'A',
                    link: function(scope, element, attributes) {
                        var imgData = scope.$eval(attributes.imgData);
                        var reader = new FileReader();
                        reader.onload = function() {
                            scope.$apply(function() {
                                var img = new Image();
                                img.onload = function() {
                                    element.attr('src', img.src);
                                };
                                img.src = reader.result;
                                scope.$broadcast('loadedImg', img, img.src);
                            });
                        };
                        reader.readAsDataURL(imgData);
                    }
                };
            }
        ])
    /* read a file from a url and convert it to a data src 
(this will only work for CORS images, in non-cors supporting browsers 
serve images from the same domain as the user is on. */
    .directive('imgDataFromUri', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {
                // Create an empty canvas element
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');

                var img = new Image();
                img.onload = function() {

                    var cw = canvas.width = img.width;
                    var ch = canvas.height = img.height;
                    // Copy the image contents to the canvas
                    ctx.drawImage(img, 0, 0);
                    var dataURL = canvas.toDataURL('image/jpeg',1);
                    var loadedImgData = new Image();
                    loadedImgData.src = dataURL;
                    // $(element).css('width', img.width + 'px');
                    // $(element).css('height', img.height + 'px');
                    var crop = scope.model.crop(scope);
                    if (crop && crop.length > 0) {
                        //apply the crop programatically pre-load
                        var cropImage = new Image();
                        cropImage.src = dataURL;
                        var selected = crop;
                        selected.w = selected.x2 - selected.x;
                        selected.h = selected.y2 - selected.y;
                        cw = canvas.width;
                        ch = canvas.height;
                        // create 2 temporary canvases
                        var canvas1 = document.createElement('canvas');
                        var ctx1 = canvas1.getContext('2d');
                        var canvas2 = document.createElement('canvas');
                        var ctx2 = canvas2.getContext('2d');
                        var rectBB = getRotatedRectBB(
                            selected.x, selected.y, selected.w, selected.h, 0);
                        // clip the boundingbox of the crop rect
                        // to a temporary canvas
                        canvas1.width = canvas2.width = rectBB.width;
                        canvas1.height = canvas2.height = rectBB.height;
                        ctx1.drawImage(cropImage,
                            rectBB.cx - rectBB.width / 2,
                            rectBB.cy - rectBB.height / 2,
                            rectBB.width,
                            rectBB.height,
                            0, 0, rectBB.width, rectBB.height);
                        ctx2.translate(parseInt(canvas1.width / 2),
                            parseInt(canvas1.height / 2));
                        ctx2.drawImage(canvas1,
                            parseInt(-canvas1.width / 2), parseInt(-canvas1.height / 2));
                        // draw the rect to the display canvas
                        var offX = rectBB.width / 2 - selected.w / 2;
                        var offY = rectBB.height / 2 - selected.h / 2;
                        canvas.width = selected.w;
                        canvas.height = selected.h;
                        cw = canvas.width;
                        ch = canvas.height;
                        ctx.drawImage(canvas2, -offX, -offY);
                        //clear temp variables
                        cropImage = canvas1 = canvas2 = ctx1 = ctx2 = offY = offX = null;
                        dataURL = canvas.toDataURL('image/jpeg',1);
                    }
                    if (scope.model.rotation(scope)) {
                        //apply any rotation next
                        var angle = scope.model.rotation(scope);
                        while (angle < 0) {
                            angle += 360;
                        }
                        var rotations = (angle / 90) % 4;
                        var rotateImage = new Image();
                        rotateImage.src = dataURL;
                        //it would be better to do the rotation in one batch,
                        //but this will work for now. TODO
                        for (var i = 0; i < rotations; i++) {
                            canvas.width = ch;
                            canvas.height = cw;
                            cw = canvas.width;
                            ch = canvas.height;
                            ctx.save();
                            // translate and rotate
                            ctx.translate(cw, ch / cw);
                            ctx.rotate(Math.PI / 2);
                            // draw the previows image, now rotated
                            ctx.drawImage(rotateImage, 0, 0);
                            ctx.restore();
                            rotateImage.src = canvas.toDataURL('image/jpeg',1);
                        }
                        // clear the temporary image
                        rotateImage = null;
                        //save 
                        dataURL = canvas.toDataURL('image/jpeg',1);
                    }
                    scope.$broadcast('loadedImg', loadedImgData, dataURL);
                    element.attr('src', dataURL);


                };


                img.crossOrigin = '';
                attributes.$observe('imgDataFromUri', function(val) {
                    img.src = val;
                });
            }
        };
    })
        .directive('imgThumb', [

            function() {
                return {
                    restrict: 'A',
                    link: function(scope, element, attributes) {
                        scope.$on('loadedImg', function(e, img, imgSRC) {
                            element.attr('src', imgSRC);
                        });
                        scope.$on('update', function(e, imgSRC) {
                            element.attr('src', imgSRC);
                        });
                    }
                };
            }
        ])
    /* add listeners for 'crop', 'rotate' and 'rest' brodcasts */
    .directive('imgEditable', function($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {
                var jcrop_api;
                var croppedImage; //this will be used to support cancel of crop.
                var fullSize = new Image();
                var orig = new Image();
                scope.model = {};
                scope.model.crop = $parse(attributes.crop);
                scope.model.rotation = $parse(attributes.rotation);
                scope.model.trueSize = $parse(attributes.trueSize);
                scope.model.base64   = $parse(attributes.base64);
                scope.model.ratio    = parseFloat(attributes.ratio);

                scope.$on('loadedImg', function(e, img, base64) {
                    scope.model.base64.assign(scope, base64);
                });
                scope.$on('update', function(e, base64) {
                    scope.model.base64.assign(scope, base64);
                });
                if (!scope.crop) {
                    scope.crop = false;
                }
                if (!scope.rotation) {
                    scope.rotation = 0;
                }
                if (element.attr('src') && element.attr('src').length > 1) {
                    fullSize.src = element.attr('src');
                } //load the src if it was already on the dom
                scope.$on('loadedImg', function(e, img, imgSRC) {
                    //if we are using one of the helpers to load img data 
                    //this will load the full sized as original and cropped into the view
                    fullSize.src = imgSRC;
                    orig.src = img.src;
                });
                //listen for actions
                scope.$on('crop', function() {
                    scope.cropping = true;
                    croppedImage = new Image();
                    croppedImage.src = element.attr('src');
                    //re-load the full size image, 
                    //instead of the cropped on so that the user can crop wider
                    element.attr('src', fullSize.src);

                    //Init Jcrop with old selection if one exists
                    console.log([fullSize.width, fullSize.height]);
                    if (scope.crop) {
                        var pt1 = rotatePoint(scope.crop.x, scope.crop.y,
                            orig.width, orig.height, scope.rotation);
                        var pt2 = rotatePoint(scope.crop.x2, scope.crop.y2,
                            orig.width, orig.height, scope.rotation);
                        var selectedInit = [pt1.x, pt1.y, pt2.x, pt2.y];
                        $(element).Jcrop({
                            'trueSize': [fullSize.width, fullSize.height],
                            'setSelect': selectedInit,
                            'aspectRatio' : scope.model.ratio
                        }, function() {
                            jcrop_api = this;
                        });
                    } else {
                        $(element).Jcrop({
                            'trueSize': [fullSize.width, fullSize.height],
                            'aspectRatio' : scope.model.ratio
                        }, function() {
                            jcrop_api = this;
                        });
                    }
                });

                scope.$on('reset', function() {
                    scope.crop = false;
                    scope.rotation = 0;
                    reset();
                    //brodcast update
                    scope.$broadcast('update', orig.src);
                });

                scope.$on('save', function() {
                    if (scope.cropping) {
                        croppedImage = null;
                        //main crop function.
                        scope.cropping = false;
                        //Save the new crop to the scope
                        var crop = jcrop_api.tellSelect();

                        var p1 = rotatePoint(crop.x, crop.y,
                            fullSize.width, fullSize.height, -scope.rotation);
                        var p2 = rotatePoint(crop.x2, crop.y2,
                            fullSize.width, fullSize.height, -scope.rotation);
                        var w, h;
                        scope.crop = {
                            x: p1.x,
                            y: p1.y,
                            x2: p2.x,
                            y2: p2.y
                        };
                        //save the crop in origin cords
                        scope.model.crop.assign(scope, scope.crop);
                        //remove jcrop applied width and height for native sizing
                        $(element).css('width', '');
                        $(element).css('height', '');
                        //turn off jcrop
                        jcrop_api.destroy();
                        //apply the crop (requires canvas support)
                        applyCrop(crop);
                    }
                });

                scope.$on('cancel', function() {
                    if (scope.cropping) {
                        scope.cropping = false;
                        element.attr('src', croppedImage.src);
                        $(element).css('width', '');
                        $(element).css('height', '');
                        croppedImage = null;
                        jcrop_api.destroy();
                    }
                    //extend if other methods need cancel support
                });

                //rotate
                scope.$on('rotate', function() {
                    scope.rotation = (scope.rotation + 90) % 360;
                    //update the model
                    scope.model.rotation.assign(scope, scope.rotation);
                    doRotate();
                });

                //Functions
                function reset() {
                    croppedImage = null;
                    element.attr('src', orig.src);
                    // $(element).css('width', orig.width + 'px');
                    // $(element).css('height', orig.height + 'px');
                    fullSize.src = orig.src; //reset the saved crop image as well
                }

                function doRotate() {
                    var img = new Image();
                    img.onload = function() {
                        var myImage;
                        var rotating = false;
                        var canvas = document.createElement('canvas');
                        var ctx = canvas.getContext('2d');
                        var cw, ch;
                        canvas.width = img.width;
                        canvas.height = img.height;
                        cw = canvas.width;
                        ch = canvas.height;
                        ctx.drawImage(img, 0, 0, img.width, img.height);
                        if (!rotating) {
                            rotating = true;
                            // store current data to an image
                            myImage = new Image();
                            myImage.src = canvas.toDataURL('image/jpeg',1);
                            myImage.onload = function() {
                                // reset the canvas with new dimensions
                                canvas.width = ch;
                                canvas.height = cw;
                                cw = canvas.width;
                                ch = canvas.height;
                                ctx.save();
                                // translate and rotate
                                ctx.translate(parseInt(cw), parseInt(ch / cw));
                                ctx.rotate(Math.PI / 2);
                                // draw the previows image, now rotated
                                ctx.drawImage(myImage, 0, 0);
                                ctx.restore();
                                // clear the temporary image
                                myImage = null;
                                rotating = false;
                                element.attr('src', canvas.toDataURL('image/jpeg',1));
                                scope.$broadcast('update', canvas.toDataURL('image/jpeg',1));
                                canvas = null;
                            };
                        }
                    };
                    img.src = element.attr('src');
                    rotateFullSize();
                }

                function rotateFullSize() {
                    //silently rotate the full size image in the background
                    var img2 = new Image();
                    img2.onload = function() {
                        var myImage2, rotating2 = false;
                        var canvas2 = document.createElement('canvas');
                        var ctx2 = canvas2.getContext('2d');
                        var cw2, ch2;
                        canvas2.width = img2.width;
                        canvas2.height = img2.height;
                        cw2 = canvas2.width;
                        ch2 = canvas2.height;
                        ctx2.drawImage(img2, 0, 0, img2.width, img2.height);
                        if (!rotating2) {
                            rotating2 = true;
                            // store current data to an image
                            myImage2 = new Image();
                            myImage2.src = canvas2.toDataURL('image/jpeg',1);
                            myImage2.onload = function() {
                                // reset the canvas with new dimensions
                                canvas2.width = ch2;
                                canvas2.height = cw2;
                                cw2 = canvas2.width;
                                ch2 = canvas2.height;
                                ctx2.save();
                                // translate and rotate
                                ctx2.translate(parseInt(cw2), parseInt(ch2 / cw2));
                                ctx2.rotate(Math.PI / 2);
                                // draw the previows image, now rotated
                                ctx2.drawImage(myImage2, 0, 0);
                                ctx2.restore();
                                // clear the temporary image
                                myImage2 = null;
                                rotating2 = false;
                                var newImgSrc = canvas2.toDataURL('image/jpeg',1);
                                canvas2 = null;
                                fullSize.src = newImgSrc;
                            };
                        }
                    };
                    img2.src = fullSize.src;
                }

                function applyCrop(crop) {
                    var cropImage = new Image();
                    cropImage.src = element.attr('src');
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    var selected = crop;
                    var cw = canvas.width;
                    var ch = canvas.height;
                    // create 2 temporary canvases
                    var canvas1 = document.createElement('canvas');
                    var ctx1 = canvas1.getContext('2d');
                    var canvas2 = document.createElement('canvas');
                    var ctx2 = canvas2.getContext('2d');
                    var rectBB = getRotatedRectBB(
                        selected.x, selected.y, selected.w, selected.h, 0);
                    // clip the boundingbox of the crop rect
                    // to a temporary canvas
                    canvas1.width = canvas2.width = rectBB.width;
                    canvas1.height = canvas2.height = rectBB.height;
                    ctx1.drawImage(cropImage,
                        rectBB.cx - rectBB.width / 2,
                        rectBB.cy - rectBB.height / 2,
                        rectBB.width,
                        rectBB.height,
                        0, 0, rectBB.width, rectBB.height);
                    ctx2.translate(parseInt(canvas1.width / 2),
                        parseInt(canvas1.height / 2));
                    ctx2.drawImage(canvas1,
                        parseInt(-canvas1.width / 2), parseInt(-canvas1.height / 2));
                    // draw the rect to the display canvas
                    var offX = rectBB.width / 2 - selected.w / 2;
                    var offY = rectBB.height / 2 - selected.h / 2;
                    canvas.width = selected.w;
                    canvas.height = selected.h;
                    cw = canvas.width;
                    ch = canvas.height;
                    ctx.drawImage(canvas2, -offX, -offY);
                    element.attr('src', canvas.toDataURL('image/jpeg',1));
                    // $(element).css('width', selected.w + 'px');
                    // $(element).css('height', selected.h + 'px');
                    scope.$broadcast('update', canvas.toDataURL('image/jpeg',1));
                    cropImage = canvas = ctx = cw = ch = selected =
                        ctx1 = ctx2 = canvas1 = canvas2 = rectBB = offX = offY = null;
                } // end crop using canvas.
                //helper functions

                function rotatePoint(pointX, pointY, width, height, angle) {
                    if (angle === 0) {
                        return {
                            x: pointX,
                            y: pointY
                        };
                    } else if (Math.abs(angle) === 180) {
                        return {
                            x: width - pointX,
                            y: height - pointY
                        };
                    } else {
                        var rad = angle * Math.PI / 180.0; //convert to rad
                        var x = pointX - width / 2; //convert to normal grid
                        var y = pointY - height / 2;
                        var offsetX = height / 2,
                            offsetY = width / 2;
                        return {
                            x: parseInt(Math.cos(rad) * x - Math.sin(rad) * y + offsetX),
                            y: parseInt(Math.sin(rad) * x + Math.cos(rad) * y + offsetY)
                        };
                    }
                }
            }
        };
    });

    /*Global private helper functions */
    function getRotatedRectBB(x, y, width, height, rAngle) {
        var absCos = Math.abs(Math.cos(rAngle));
        var absSin = Math.abs(Math.sin(rAngle));
        var cx = x + width / 2 * Math.cos(rAngle) -
            height / 2 * Math.sin(rAngle);
        var cy = y + width / 2 * Math.sin(rAngle) +
            height / 2 * Math.cos(rAngle);
        var w = width * absCos + height * absSin;
        var h = width * absSin + height * absCos;
        return ({
            cx: cx,
            cy: cy,
            width: w,
            height: h
        });
    }

})();
