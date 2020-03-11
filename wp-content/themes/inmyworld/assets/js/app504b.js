(function($) {

	"use strict";

	let domain = window.location.hostname;
	var windowWidth,
		windowHeight;

	let loader = $('#wrap > .loader'),
		mainContent = $("#main-content"),
		nav = $('.topbar nav'),
		burger = $('.topbar .burger'),
		menuItems = nav.find('ul li'),
		storyMainImage = "",
		chapterImages = [],
		notYetScrolled = true;

	$(window).on('load', function() {
		createChapterImageArray();
		loader.fadeOut(1000);
		windowWidth = $(window).width();
		windowHeight = window.innerHeight;

		if ($('#wpadminbar').length > 0) {
			$('.topbar').css('top', '32px');
		}

		$('#wrap').innerHeight(windowHeight);
		mainContent.innerHeight(windowHeight);

		$('.masonry-container').masonry({
			itemSelector: '.item',
			percentPosition: true,
			gutter: 10
		});
	});

	//Page load transitions

	function loadPage(page, back) {
		loader.fadeIn(1000);
		setTimeout(function() {
			$('html,body').scrollTop(0);
			nav.removeClass('open');
			menuItems.removeClass('seen');
			burger.removeClass('open');

			mainContent.load(page + ' #main-content > *', function () {	
				var title = $('#main-content').find('> div[data-title]').attr('data-title');
				document.title = title;

				ga('set', 'page', window.location.pathname);
				ga('send', 'pageview');

				createChapterImageArray();

				notYetScrolled = true;

				//THIS NEEDS LOOKING AT FOR FUTURE SLIDERS
				$('.large-carousel .slider').slick(sliderSettings);
				$('.large-carousel .slider').find('.slide').removeClass('inactive');
				animateSlideInfoIn($('.large-carousel .slider .slide.slick-current .info-section'));
				ScrollEventListener($('[data-page="main-story"]'));
				ScrollEventListener($('[data-page="your-stories"]'));

				$('.standard-slider .slider').slick(standardSliderSettings);

				var masonryItems = $('.masonry-container .item');

                masonryItems.hide();
                masonryItems.imagesLoaded().progress( function( imgLoad, image ) {
                    let item = $( image.img ).parents('.item');
                    item.show();
                    
					$('.masonry-container').masonry({
						itemSelector: '.item',
						percentPosition: true,
						gutter: 10
					});
                });

				catId = $('.masonry-container').attr('data-cat-id');
				postsLoaded = $('.masonry-container').attr('data-posts-amount');

				loader.fadeOut(1000);
			});

		}, 1000);

        if (true !== back) {
            history.pushState({
                pageHistory: page
            }, null, page);
        }
	}

	$(document).ready(function() {
		$('body').on('click', 'a:not(.ab-item)', function(e) {
			e.preventDefault();
			var href = $(this).attr('href'),
				currentPath = window.location.pathname;
	
			if( href.indexOf('wp-admin') < 0 && domain === this.hostname || !this.hostname.length) {
				if (href != currentPath) {
					loadPage(href, false);
				}
			}
			else {
				window.open(href, '_blank');
			}
		});

		$('body').on('change', 'input[type="file"]', function(e) {
			$('label[for="image"] span').text(e.target.files[0].name);
		});

		var lastScrollTop = 0;

		$(document).on('mousewheel touchstart', function() {
			if (notYetScrolled) {
				$('.featured-image-caption, [data-page="main-story"] .featured-image .scroll-instruction').css({
					opacity: 0
				});

				setTimeout(function() {
					notYetScrolled = false;
					$('#main-content > div').css({
						'overflow-y': 'auto'
					});
				}, 500);
			}
		});

		$('#main-content').on("DIVscroll", '[data-page="main-story"]', function(event){
			var scrollUp = false;
			var st = $(this).scrollTop();
			if (st < lastScrollTop){
				scrollUp = true;
			}
			lastScrollTop = st;

			var fadeOut = false;
			$('.scrolled-content > .module:not(.slim)').each(function(i,v) {
				if ($(this).isInViewport(150, 300)) {
					fadeOut = true;
				}
			});

			if (fadeOut) {
				$('.fixed-content').css('opacity', '0');
				
				setTimeout(function() {
					var currentChapterImage = getCurrentChapterImage();
					$('.fixed-content .inner-box').css('background-image', currentChapterImage);
				}, 1000);
			} else {
				$('.fixed-content').css('opacity', '1');
			}

			updateStoryProgress();
		});

		$('#main-content').on("DIVscroll", '[data-page="your-stories"]', function(event){
			var scrollUp = false;
			var st = $(this).scrollTop();
			if (st < lastScrollTop){
				scrollUp = true;
			}
			lastScrollTop = st;

			if (!scrollUp && !loadingPosts) {
				if (catId > 0 && $('.masonry-divide').isInViewport(0, 0)) {
					loadingPosts = true;
					loadPosts();
				}
			}
		});
	});

	function createChapterImageArray() {
		chapterImages = [];
		storyMainImage = "";
		storyMainImage = $('.fixed-content .inner-box').css('background-image');

		$(".module img[data-image]").each(function(i, v) {
			chapterImages.push({
				index: i,
				element: $(this),
				image: "url(" + $(this).attr("data-image") + ")"
			});
		});
	}

	function getCurrentChapterImage() {
		var currentImage = {};
		var atLeastOneAbove = false;
		for (var i = 0; i < chapterImages.length; i++) {
			var item = chapterImages[i];

			if (getImagePos(item.element) == "above") {
				currentImage = item;
				atLeastOneAbove = true;
			}
		}
		return atLeastOneAbove ? currentImage.image : storyMainImage;
	}

	function getImagePos(element) {
		var mainScrollTop = $('#main-content').scrollTop();
		var elementPosition = element.offset().top;

		if (elementPosition >= mainScrollTop) {
			return "below";
		} else {
			return "above";
		}
	}

	function ScrollEventListener(el){
		el.on("scroll", function(event){
		  el.trigger("DIVscroll");
		});
	}

	ScrollEventListener($('[data-page="main-story"]'));
	ScrollEventListener($('[data-page="your-stories"]'));

	function updateStoryProgress() {
		var winScroll = $('[data-page="main-story"]').scrollTop();
		var height = $('[data-page="main-story"] > div').height() - $(window).height();
		var scrolled = (winScroll / height) * 100;
		if (scrolled >= 100) {
			scrolled = 100;
		}
		$('.story-timeline .progress-container .progress-bar').width(scrolled + '%');
	}

	window.onpopstate = function (event) {
        let content = "";
        if (event.state) {
            content = event.state.pageHistory;
        }
        loadPage(content, true);
    }

	//Navigation
	$('.topbar .burger').on('click', function() {
		if (nav.hasClass('open')) {	
			setTimeout(function() {
				menuItems.removeClass('seen');
			}, 1000);
		}
		else {
			var offset = 500;

			for (var i = 0; i < menuItems.length; i++) {
				try{throw i}
				catch(ii) {
					setTimeout(function(){
						var menuItem = $(menuItems[ii]);
						menuItem.addClass('seen')
					}, offset);
				}

				offset += 300;
			}
		}

		$(this).toggleClass('open');
		nav.toggleClass('open');
	});

	//Home Carousel
	$('#main-content').on('init', '.large-carousel .slider', function(e, slick) {
		var carousel = $(this).closest('.large-carousel');
		carousel.find('.controls .prev').css('opacity', '.5');
		animateSlideInfoIn(carousel.find('.slide.slick-current .info-section'));
	});

	var sliderSettings = {
		infinite: false,
		centerMode: true,
		centerPadding: '100px',
		variableWidth: true,
		adaptiveHeight: true,
		dots: false,
		appendArrows: '.controls',
		prevArrow: '<div class="prev slick-arrow"><svg fill="#fff" enable-background="new 0 0 551.13 551.13" height="512" viewBox="0 0 551.13 551.13" width="512" xmlns="http://www.w3.org/2000/svg"><path d="m189.451 275.565 223.897-223.897v-51.668l-275.565 275.565 275.565 275.565v-51.668z"/></svg></div>',
		nextArrow: '<div class="next slick-arrow"><svg fill="#fff" enable-background="new 0 0 551.13 551.13" height="512" viewBox="0 0 551.13 551.13" width="512" xmlns="http://www.w3.org/2000/svg"><path d="m361.679 275.565-223.896 223.897v51.668l275.565-275.565-275.565-275.565v51.668z"/></svg></div>'
	}

	$('.large-carousel .slider').slick(sliderSettings);
	$('.large-carousel .slider').find('.slide').removeClass('inactive');

	$('#main-content').on('click', '.slide', '.large-carousel .slider', function (e) {
		var index = $(this).index();
		if ($('.large-carousel .slider').slick('slickCurrentSlide') !== index) {
			e.stopPropagation();
			$('.large-carousel .slider').slick('slickGoTo', index);
		}
	});

	$(window).on('resize', function() {
		if( windowWidth != $( window ).width() ){
			windowWidth = $( window ).width();

			$('.large-carousel .slider').slick('unslick');
			$('.large-carousel .slider').slick(sliderSettings);
		}

		windowWidth = $(window).width();
		windowHeight = window.innerHeight;
		$('#wrap').innerHeight(windowHeight);
		mainContent.innerHeight(windowHeight);
	});

	$('#main-content').on('beforeChange', '.large-carousel .slider', function(e, slick) {
		var carousel = $(this).closest('.large-carousel');
		// carousel.find('.slider .slide').css('transform', 'unset');
		animateSlideInfoOut(carousel.find('.slide.slick-current .info-section'));
	});

	$('#main-content').on('afterChange', '.large-carousel .slider', function(e, slick) {
		var slideCount = slick.$slides.length;
		var carousel = $(this).closest('.large-carousel');
		carousel.find('.controls .prev').css('opacity', '1');
		carousel.find('.controls .next').css('opacity', '1');
		if (slick.currentSlide == 0) {
			carousel.find('.controls .prev').css('opacity', '.5');
		}
		if (slick.currentSlide == (slideCount - 1)) {
			carousel.find('.controls .next').css('opacity', '.5');
		}
		animateSlideInfoIn(carousel.find('.slide.slick-current .info-section'));
	});

	var mouseDown = false;
	$('#main-content').on('mousedown touchstart', '.large-carousel .slider', function(e){
		mouseDown = true;
	}).on('mouseup touchend', function(e) {
		mouseDown = false;
		var carousel = $(this).find('.large-carousel');
		animateSlideInfoIn(carousel.find('.slide.slick-current .info-section'));
	}).on('mousemove touchmove', function(e) {
		if (mouseDown) {
			var carousel = $(this).find('.large-carousel');
			animateSlideInfoOut(carousel.find('.slide.slick-current .info-section'));
		}
	});

	$('#main-content').on('mouseover', '.large-carousel .slider .slide .info-section .btn', function() {
		if (!mouseDown) {
			$('.large-carousel .slider .slide:not(.slick-current)').addClass('zoom-out');
			$('.large-carousel .slider .slide.slick-current').addClass('zoom-in');
		}
	}).on('mouseout', '.large-carousel .slider .slide .info-section .btn', function() {
		if (!mouseDown) {
			$('.large-carousel .slider .slide:not(.slick-current)').removeClass('zoom-out');
			$('.large-carousel .slider .slide.slick-current').removeClass('zoom-in');
		}
	});

	//Secondary sliders
	var standardSliderSettings = {
		infinite: true,
		adaptiveHeight: true,
		dots: false,
		appendArrows: '.controls',
		prevArrow: '<div class="prev slick-arrow"><svg fill="#fff" enable-background="new 0 0 551.13 551.13" height="512" viewBox="0 0 551.13 551.13" width="512" xmlns="http://www.w3.org/2000/svg"><path d="m189.451 275.565 223.897-223.897v-51.668l-275.565 275.565 275.565 275.565v-51.668z"/></svg></div>',
		nextArrow: '<div class="next slick-arrow"><svg fill="#fff" enable-background="new 0 0 551.13 551.13" height="512" viewBox="0 0 551.13 551.13" width="512" xmlns="http://www.w3.org/2000/svg"><path d="m361.679 275.565-223.896 223.897v51.668l275.565-275.565-275.565-275.565v51.668z"/></svg></div>'
    }
    
    $('.standard-slider .slider').slick(standardSliderSettings);

	function animateSlideInfoIn(content) {
		var subtitle = content.children('.subtitle'),
			title = content.children('.title'),
			desc = content.children('.description'),
			button = content.children('.btn');

			title.css('opacity', '1');
			
			setTimeout(function() {
				title.css('filter', 'blur(0)');
			}, 500);

			setTimeout(function() {
				subtitle.css('opacity', '1');
				desc.css('opacity', '1');
				button.css('opacity', '1');
			}, 600);
	}

	function animateSlideInfoOut(content) {
		var subtitle = content.children('.subtitle'),
			title = content.children('.title'),
			desc = content.children('.description'),
			button = content.children('.btn');

			subtitle.css('opacity', '0');
			desc.css('opacity', '0');
			title.css({
				'opacity': '0',
				'filter': 'blur(5px)'
			});
			button.css('opacity', '0');
	}

	$.fn.isInViewport = function(offsetTop, offsetBottom) {
		var elementTop = $(this).offset().top + offsetTop;
		var elementBottom = elementTop + $(this).outerHeight() - offsetBottom;
		var viewportTop = $(window).scrollTop();
		var viewportBottom = viewportTop + $(window).height();
		return elementBottom > viewportTop && elementTop < viewportBottom;
	};

})(jQuery);