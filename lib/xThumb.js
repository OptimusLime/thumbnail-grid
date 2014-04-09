/*
* debouncedresize: special jQuery event that happens once after a window resize
*
* latest version and complete README available on Github:
* https://github.com/louisremi/jquery-smartresize/blob/master/jquery.debouncedresize.js
*
* Copyright 2011 @louis_remi
* Licensed under the MIT license.
*/

//note that we're removing jquery from everything...
//we don't want to require jquery to use the thumbnail layout. Why do you need such a behemoth?
var matches = require('matches-selector')
var getIndex = require('indexof')
var emitter = require('emitter');


//stored data with an html div object -- like jquery data
var _data = require('data');
var _offset = require('offset');
var _dimensions = require('dimensions');
var _el = require('el.js');
var _classes = require('classes');
var _fade = require('fade');
var _css = require('css');
// var _scrollTo = require('scroll-to');
var _animateProperty = require('animate-property');

var $event = $.event,
$special,
resizeTimeout;

var emitEvents = {};
emitter(emitEvents);

var resizeThreshold = 250;
//add resize to window
this.addEventListener('resize', function(event, execAsap)
{
	// Save the context
		var context = this,
			args = arguments,
			dispatch = function() {
				// set correct event type
				var ev = "debouncedresize";
				//prepend event to args
				[].splice.call(args, 0, 0, ev, context);
				//then we make the emit call -- where context is the "this" == window
				emitEvents.emit.apply(emitEvents, args);
				// $event.dispatch.apply( context, args );
			};

		if ( resizeTimeout ) {
			clearTimeout( resizeTimeout );
		}

		// execAsap ?
			// dispatch() :
			resizeTimeout = setTimeout( dispatch, resizeThreshold );


})

// $special = $event.special.debouncedresize = {
// 	setup: function() {
// 		$( this ).on( "resize", $special.handler );
// 	},
// 	teardown: function() {
// 		$( this ).off( "resize", $special.handler );
// 	},
// 	handler: function( event, execAsap ) {
// 		// Save the context
// 		var context = this,
// 			args = arguments,
// 			dispatch = function() {
// 				// set correct event type
// 				event.type = "debouncedresize";
// 				$event.dispatch.apply( context, args );
// 			};

// 		if ( resizeTimeout ) {
// 			clearTimeout( resizeTimeout );
// 		}

// 		execAsap ?
// 			dispatch() :
// 			resizeTimeout = setTimeout( dispatch, $special.threshold );
// 	},
// 	threshold: 250
// };

// ======================= imagesLoaded Plugin ===============================
// https://github.com/desandro/imagesloaded

// $('#my-container').imagesLoaded(myFunction)
// execute a callback when all images have loaded.
// needed because .load() doesn't work on cached images

// callback function gets image collection as argument
//  this is the container

// original: MIT license. Paul Irish. 2010.
// contributors: Oren Solomianik, David DeSandro, Yiannis Chatzikonstantinou

// blank image data-uri bypasses webkit log warning (thx doug jones)
var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

$.fn.imagesLoaded = function( callback ) {
	var $this = this,
		deferred = $.isFunction($.Deferred) ? $.Deferred() : 0,
		hasNotify = $.isFunction(deferred.notify),
		$images = $this.find('img').add( $this.filter('img') ),
		loaded = [],
		proper = [],
		broken = [];

	// Register deferred callbacks
	if ($.isPlainObject(callback)) {
		$.each(callback, function (key, value) {
			if (key === 'callback') {
				callback = value;
			} else if (deferred) {
				deferred[key](value);
			}
		});
	}

	function doneLoading() {
		var $proper = $(proper),
			$broken = $(broken);

		if ( deferred ) {
			if ( broken.length ) {
				deferred.reject( $images, $proper, $broken );
			} else {
				deferred.resolve( $images );
			}
		}

		if ( $.isFunction( callback ) ) {
			callback.call( $this, $images, $proper, $broken );
		}
	}

	function imgLoaded( img, isBroken ) {
		// don't proceed if BLANK image, or image is already loaded
		if ( img.src === BLANK || $.inArray( img, loaded ) !== -1 ) {
			return;
		}

		// store element in loaded images array
		loaded.push( img );

		// keep track of broken and properly loaded images
		if ( isBroken ) {
			broken.push( img );
		} else {
			proper.push( img );
		}

		// cache image and its state for future calls
		_data( img ).set('imagesLoaded', { isBroken: isBroken, src: img.src } );

		// trigger deferred progress method if present
		if ( hasNotify ) {
			deferred.notifyWith( $(img), [ isBroken, $images, $(proper), $(broken) ] );
		}

		// call doneLoading and clean listeners if all images are loaded
		if ( $images.length === loaded.length ){
			setTimeout( doneLoading );
			$images.unbind( '.imagesLoaded' );
		}
	}

	// if no images, trigger immediately
	if ( !$images.length ) {
		doneLoading();
	} else {
		$images.bind( 'load.imagesLoaded error.imagesLoaded', function( event ){
			// trigger imgLoaded
			imgLoaded( event.target, event.type === 'error' );
		}).each( function( i, el ) {
			var src = el.src;

			// find out if this image has been already checked for status
			// if it was, and src has not changed, call imgLoaded on it
			var cached = _data( el ).get( 'imagesLoaded' );
			if ( cached && cached.src === src ) {
				imgLoaded( el, cached.isBroken );
				return;
			}

			// if complete is true and browser supports natural sizes, try
			// to check for image status manually
			if ( el.complete && el.naturalWidth !== undefined ) {
				imgLoaded( el, el.naturalWidth === 0 || el.naturalHeight === 0 );
				return;
			}

			// cached images don't fire load sometimes, so we reset src, but only when
			// dealing with IE, or image is complete (loaded) and failed manual check
			// webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
			if ( el.readyState || el.complete ) {
				el.src = BLANK;
				el.src = src;
			}
		});
	}

	return deferred ? deferred.promise( $this ) : $this;
};

function _eq(arr, ix)
{
	//get the array length -- we may need to invert ix if it's less than zero
	var arrLen = arr.length;

	//start from the end of the list
	if(ix < 0)
		ix = arrLen - Math.abs(ix);

	//return that index! 
	return arr[ix];
}
function _index(el)
{
	if(el.parentNode)
		return getIndex(el.parentNode.children, el);
	else
		return -1;
}
function _hide(div)
{
	_data(div).set('display', div.style.display);
	div.style.display = 'none';
}
function _show(div)
{
	//can't have null here!
	div.style.display = _data(div).get('display') || 'block';
}
function _firstChild(div, selMatch)
{
	var dChildren = div.children;
	for(var i=0; i < dChildren.length; i++)
	{
		//children
		var c = dChildren[i];

		//matches
		if(matches(c, selMatch))
			return c;
	}
}
function _isVisible(div)
{
	//any node without a parent and no children is clearly not visible -- how could it be
	if(!div.parentNode && !div.children.length)
		return false;

	return !(div.offsetWidth === 0 && div.offsetHeight === 0);
}

function _find(div, selMatch)
{

	var cMatch = [];
	var nextCycle = div.children;

	while(nextCycle.length)
	{
		var more = [];
		for(var i=0; i < nextCycle.length; i++)
		{
			var child = nextCycle[i];

			if(matches(child, selMatch))
				cMatch.push(child);

			var next = child.children;
			if(next.length)
				more = more.concat(next);
		}
		//keep going until no more children
		nextCycle = more;
	}

	return cMatch;
}
function _selectCheck(div, check)
{
	var regex = new RegExp("/\b" + check + "\b/");
	return div.className.match(regex)
}

var Grid = (function() {

	// var _grid = document.getElementById("og-grid");
	var $grid = $( '#og-grid' );
	var _grid = document.getElementById("og-grid");

	var $items = [];
	for(var i=0; i < _grid.children.length; i++)
	{
		var c = _grid.children[i];
		if(matches(c, 'li'))
			$items.push(c);
	}

		// list of items
	// var $grid = $( '#og-grid' ),
		// the items
		// $items = $grid.children( 'li' ),
		// current expanded item's index
	var current = -1,
		// position (top) of the expanded item
		// used to know if the preview will expand in a different row
		previewPos = -1,
		// extra amount of pixels to scroll the window
		scrollExtra = 0,
		// extra margin when expanded (between preview overlay and the next items)
		marginExpanded = 10,
		$window = $( window ), winsize,
		$body = $( 'html, body' ),
		// transitionend events
		transEndEventNames = {
			'WebkitTransition' : 'webkitTransitionEnd',
			'MozTransition' : 'transitionend',
			'OTransition' : 'oTransitionEnd',
			'msTransition' : 'MSTransitionEnd',
			'transition' : 'transitionend'
		},
		transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ],
		// support for csstransitions
		support = Modernizr.csstransitions,
		// default settings
		settings = {
			minHeight : 500,
			speed : 350,
			easing : 'ease'
		};

	function init( config ) {
		
		console.log("Pre settings: ", settings);

		// the settings..
		settings = $.extend( true, {}, settings, config );
		console.log("Post settings: ", settings);
		
		// preload all images
		$grid.imagesLoaded( function() {

			console.log("Images loaded");
			// save item´s size and offset
			saveItemInfo( true );
			// get window´s size
			winsize = cGetWinSize();
			// initialize some events
			initEvents();

		} );

	}

	// add more items to the grid.
	// the new items need to appended to the grid.
	// after that call Grid.addItems(theItems);
	function addItems( $newitems ) {

		$items = $items.concat( $newitems );

		for(var i=0; i < $newitems.length; i++)
		{
			var $item = $newitems[i];
			_data($item).set( {
				offsetTop : _offset($item).top,
				height : _dimensions($item).height()
			} );
		}

		c_init_items_events( $newitems );
	}

	// saves the item´s offset top and height (if saveheight is true)
	function saveItemInfo( saveheight ) {

		for(var i=0; i < $items.length; i++)
		{
			var $item = $items[i];
			var iData = _data($item);
			iData.set( 'offsetTop',  _offset($item).top );
			if( saveheight ) {
				iData.set( 'height', _dimensions($item).height() );
			}
		}
	}

	function initEvents() {
		
		// when clicking an item, show the preview with the item´s info and large image.
		// close the item if already expanded.
		// also close if clicking on the item´s cross
		c_init_items_events( $items );
		
		// on window resize get the window´s size again
		// reset some values..
		emitEvents.on( 'debouncedresize', function() {
			var context = arguments[0];
			scrollExtra = 0;
			previewPos = -1;
			// save item´s offset
			saveItemInfo();
			winsize = cGetWinSize();
			var preview = _data( context ).get( 'preview' );
			if( typeof preview != 'undefined' ) {
				hidePreview();
			}

		} );

	}

	function c_init_items_events($items)
	{
		console.log($items);

		//have to loop through html elements and add click events like jquery
		for(var i=0; i < $items.length; i++)
		{
			var div = $items[i];
			//check if we match this selector (like jQuery.on)
			if(matches(div, 'span.og-close'))
			{
				//if we do, add a click event
				div.addEventListener('click', function(e)
				{
					//make sure to hide when close clicked
					hidePreview();
					//do not follow links
					e.preventDefault();
  					e.stopPropagation();
				});
			}

			//for all the children link objects <a>
			var dChildren = div.children;
			for(var c=0; c < dChildren.length; c++)
			{
				var child = dChildren[c];
				if(matches(child, 'a'))
				{
					//add a click event for this ref
					child.addEventListener('click', function(e)
					{
						//get its parents
						var $item = this.parentNode;

						// check if item already opened
						//check the index of this object, relative to the parents
						current === _index($item) ? hidePreview() : showPreview( $item );
						
						//do not follow links -- don't allow event to propogate
						e.preventDefault();
	  					e.stopPropagation();

					})
				}

			}
		}
	}


	function cGetWinSize() {
		var w = window;
    	var e = document.documentElement,
	    	g = document.getElementsByTagName('body')[0];

	    return {width: w.innerWidth || e.clientWidth || g.clientWidth, height: w.innerHeight|| e.clientHeight|| g.clientHeight};
	}

	function showPreview( $item ) {

		var preview = _data( this ).get( 'preview' ),
			// item´s offset top
			position = _data($item).get( 'offsetTop' );

		scrollExtra = 0;

		// if a preview exists and previewPos is different (different row) from item´s top then close it
		if( typeof preview != 'undefined' ) {

			// not in the same row
			if( previewPos !== position ) {
				// if position > previewPos then we need to take te current preview´s height in consideration when scrolling the window
				if( position > previewPos ) {
					scrollExtra = preview.height;
				}
				hidePreview();
			}
			// same row
			else {
				preview.update( $item );
				return false;
			}
			
		}

		// update previewPos
		previewPos = position;

		preview = new Preview( $item );
		// initialize new preview for the clicked item
		_data( this ).set( 'preview' , preview );

		// expand preview overlay
		preview.open();

	}

	function hidePreview() {
		current = -1;
		var preview = _data( this ).get( 'preview' );
		preview.close();
		_data(this).del('preview');
	}

	// the preview obj / overlay
	function Preview( $item ) {
		this.$item = $item;
		this.expandedIdx = _index(this.$item);
		this.create();
		this.update();
	}

	function _wrapOpenTimeout(obj, delay)
	{
		setTimeout(function(){

			// set the height for the preview and the item
			obj.setHeights();
			// scroll to position the preview in the right place
			obj.positionPreview();


		}, delay)
	}
	function _wrapClose(obj, delay, onEndFn)
	{
		setTimeout( function() {

			if( typeof obj.$largeImg !== 'undefined' ) {
				//i believe fadeout fast == 200 ms, slow = 600ms
				_fade.out(obj.$largeImg, 200);//.fadeOut( 'fast' );
			}

			_css(obj.$previewEl, 'height', 0 );
			// the current expanded item (might be different from obj.$item)
			var $expandedItem = _eq($items, obj.expandedIdx );
			
			_css($expandedItem, 'height', _data($expandedItem).get( 'height' ) );

			$expandedItem.addEventListener(transEndEventName, onEndFn);

			if( !support ) {
				onEndFn.call();
			}

		}, delay );

	}

	Preview.prototype = {
		create : function() {
			// create Preview structure:
			this.$title = document.createElement('h3');
			this.$description = document.createElement('p');
			this.$href = _el('a', {href: "#"}, 'Visit Website');// '<a href="#">Visit website</a>' );
			this.$details = _el( 'div', {class : "og-details"}, [this.$title, this.$description, this.$href]);
			this.$loading = _el( 'div', {class:"og-loading"} );
			this.$fullimage = _el( 'div', {class: "og-fullimg"}, [this.$loading]);
			this.$closePreview = _el('span', {class: "og-close"});
			this.$previewInner = _el( 'div', {class : "og-expander-inner"}, [this.$closePreview, this.$fullimage, this.$details]);
			this.$previewEl = _el( 'div', {class : "og-expander"}, [this.$previewInner]);
			// append preview element to the item
			this.$item.appendChild( this.getEl() );
			// set the transitions for the preview and the item
			if( support ) {
				this.setTransition();
			}
		},
		update : function( $item ) {

			if( $item ) {
				this.$item = $item;
			}
			
			// if already expanded remove class "og-expanded" from current item and add it to new item
			if( current !== -1 ) {
				//what is this function call eq?
				var $currentItem = _eq($items, current );
				_classes($currentItem).remove( 'og-expanded' );
				_classes(this.$item).add( 'og-expanded' );
				// position the preview correctly
				this.positionPreview();
			}

			// update current value
			current = _index(this.$item);

			// update preview´s content
			var $itemEl, eldata;

			$itemEl = _firstChild(this.$item, 'a');
			var iData = _data($itemEl);
			eldata = {
				href : $itemEl.getAttribute( 'href' ),
				largesrc : iData.get( 'largesrc' ),
				title : iData.get( 'title' ),
				description : iData.get( 'description' )
			};

			this.$title.innerHTML = ( eldata.title );
			this.$description.innerHTML = ( eldata.description );
			this.$href.setAttribute( 'href', eldata.href );

			var self = this;
			
			// remove the current image in the preview
			if( typeof self.$largeImg != 'undefined' ) {
				//pull it out!
				self.$largeImg.parentNode.removeChild(self.$largeImg);
			}

			// preload large image and add it to the preview
			// for smaller screens we don´t display the large image (the media query will hide the fullimage wrapper)
			if( _isVisible(self.$fullimage)) {
			 //_selectCheck(self.$fullimage, ':visible' ) ) {
				_show(this.$loading);

				var nImg = document.createElement('img');

				//then load?
				nImg.onload = function()
				{
					var $img =  this;
					//check if we're loaded or something
					if( $img.getAttribute( 'src' ) === _data(_firstChild(self.$item, 'a')).get( 'largesrc' ) ) {
						
						//finisehd laoding
						_hide(self.$loading);

						//find any images and remove them -- take note -- this is the delete phase
						//in the future, we'll customize this
						var images = _find(self.$fullimage, 'img');
						for(var i=0; i < images.length; i++)
						{
							var div = images[i];
							//take div out of the equation -- where possible
							if(div.parentNode)
								div.parentNode.removeChild(div);
						}

						//now we fade in, I believe
						self.$largeImg = $img;
						_fade.in($img, 350);

						self.$fullimage.appendChild(self.$largeImg);
					}
				}


				//make sure we have an event listener ready when calling
				nImg.src = eldata.largesrc;

				//hack for when the image is loaded from cache
				if(nImg.complete)
					nImg.onload();

			}

		},
		open : function() {

			_wrapOpenTimeout(this, 25);

		},
		close : function() {

			var self = this,
				onEndFn = function() {
					if( support ) {

						// $( this ).off( transEndEventName );
						var d = _data(this);
						var end = d.get('onEndFn');
						this.removeEventListener(transEndEventName, end);
						//no more need of this
						d.del('onEndFn');
					}
					//remove the class name
					_classes(self.$item).remove( 'og-expanded' );
					
					//remove preview object from the world
					self.$previewEl.parentNode.removeChild(self.$previewEl);
				};

				_wrapClose(this, 25, onEndFn);
				//cache our callback
				_data(this).set('onEndFn', onEndFn);
			
			return false;

		},
		calcHeight : function() {

			var iData = _data(this.$item);
			var heightPreview = winsize.height - iData.get( 'height' ) - marginExpanded,
				itemHeight = winsize.height;

			if( heightPreview < settings.minHeight ) {
				heightPreview = settings.minHeight;
				itemHeight = settings.minHeight + iData.get( 'height' ) + marginExpanded;
			}

			this.height = heightPreview;
			this.itemHeight = itemHeight;

		},
		setHeights : function() {

			var self = this,
				onEndFn = function() {
					if( support ) {

						var d = _data(self.$item);
						var end = d.get('onEndFn');				
						self.$item.removeEventListener(transEndEventName, end);

					}
					//add expanded class
					_classes(self.$item).add( 'og-expanded' );
				};

			//must calculate heights to know heights
			this.calcHeight();

			//set the preview and item height
			_css(this.$previewEl, 'height', this.height );
			_css(this.$item, 'height', this.itemHeight )

			//set our event listener for transition end
			this.$item.addEventListener(transEndEventName, onEndFn);
		
			//save the end fn callback for later removal
			_data(self.$item).set('onEndFn', onEndFn);

			//do we call immediately?
			if( !support ) {
				onEndFn.call();
			}

		},
		positionPreview : function() {

			var iData = _data(this.$item);
			// scroll page
			// case 1 : preview height + item height fits in window´s height
			// case 2 : preview height + item height does not fit in window´s height and preview height is smaller than window´s height
			// case 3 : preview height + item height does not fit in window´s height and preview height is bigger than window´s height
			var position = iData.get( 'offsetTop' ),
				previewOffsetT =  _offset(this.$previewEl).top - scrollExtra,
				scrollVal = this.height + iData.get( 'height' ) + marginExpanded <= winsize.height ? position : this.height < winsize.height ? previewOffsetT - ( winsize.height - this.height ) : previewOffsetT;
			
			// _scrollTo(0, scrollVal, {
			// 	duration: settings.speed
			// 	// ease: settings.easing
			// });

			//scroll the display to a given offset
			//body might be many objects using jquery right now
			for(var i=0; i < $body.length; i++){
				var original = $body[i].scrollTop;
				console.log("Scrolling from: ", original, " to: ", scrollVal);
				_animateProperty($body[i], {scrollTop : scrollVal}, {duration: settings.speed});
			}

			// $body.animate( { scrollTop : scrollVal }, settings.speed );

		},
		setTransition  : function() {

			_css(this.$previewEl, 'transition', 'height ' + settings.speed + 'ms ' + settings.easing );
			_css(this.$item, 'transition', 'height ' + settings.speed + 'ms ' + settings.easing );

		},
		getEl : function() {
			return this.$previewEl;
		}
	}

	return { 
		init : init,
		addItems : addItems
	};

})();

module.exports = Grid;

