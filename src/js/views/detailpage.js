App.Views.MovieDetailView = App.Views.Page.extend({
    model: App.Models.Film,
    transition: function() {
        return { in : 'slideDownIn',
            out: 'slideUpOut'
        }
    },
    el: "#moviepage",
    events: {
        'click a#watchTrailer': 'playTrailer',
        'click a#playMovie': 'playMovie',
        'click button.play': 'playMovie',
        'click #close-player': 'closePlayer',
        'click #close-trailer': 'closeTrailer',
        'click #film-tabbar-swiper-container .swiper-slide': 'changeTab'
    },
    initialize: function(options) {
        this.listenTo(this.model, 'change:id', this.render);
        this.listenTo(this.model, 'change:rt_ratings', this.renderRatings);
        _.bindAll(this, 'playMovie', 'render');
        this.template = _.template(app.template.get("film"));
    },
    /**
     * Fetch IMDB rating using external service if film does not have one.
     *
     * @return {void}
     */
    enableRatings: function() {
        if (this.model.get("imdbrating") == false || this.model.get("imdbrating") == "Data" || this.model.get("imdbrating") == null) {
            var rating = false;
            $('[id^="imdb-rating-api"]').remove();
            this.$("imdbratings .rating").remove();
            (function(d, s, id) {
                var js, stags = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {
                    return;
                }
                js = d.createElement(s);
                js.id = id;
                js.src = "/js/vendor/rating.min.js";
                stags.parentNode.insertBefore(js, stags);
                rating = $("#imdbratings .rating").text().replace("/10", "");
            })(document, 'script', 'imdb-rating-api');
            if (rating) this.model.set("imdbrating", rating);
        }
    },
    /**
     * Enable Disqus thread if enabled by configuration.
     * It will look for a div with id "disq_thread"
     *
     */
    enableComments: function() {
        if (!App.Settings.commentsEnabled) return false;
        window.disqus_identifier = this.model.get("seo_friendly_url");
        window.disqus_title = this.model.get("title");
        window.disqus_url = window.location.href.replace("#", "#!");
        if (typeof(DISQUS) === "undefined") {
            initDisqus();
        }
        if (typeof(DISQUS) !== "undefined") {
            resetDisqus(this.model.get("seo_friendly_url"), window.disqus_url, window.disqus_url);
        }
    },
    enableAddThis: function() {
        if (window.addthis) {
            window.addthis = null;
            window._adr = null;
            window._atc = null;
            window._atd = null;
            window._ate = null;
            window._atr = null;
            window._atw = null;
        }
        (function() {
            var dsq = document.createElement('script');
            dsq.type = 'text/javascript';
            dsq.async = true;
            dsq.src = "//s7.addthis.com/js/300/addthis_widget.js#pubid=ra-540b49a3467ae07c";
            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
        })();
    },
    applyIsotope: function() {
        if (!this.isotope) {
            this.isotope = $("#film-cast-container ul").isotope({
                layoutMode: 'fitRows',
                resizable: true,
                itemSelector: '#film-cast-container .item',
                transitionDuration: '0.4s',
                // disable scale transform transition when hiding
                hiddenStyle: {
                    opacity: 0,
                    'transform': 'translateY(100%)',
                },
                visibleStyle: {
                    opacity: 1,
                    'transform': 'translateY(0%)',
                },
                animationOptions: {
                    duration: 250,
                    easing: 'linear',
                    queue: true,
                }
            });
            this.isotope.isotope('on', 'layoutComplete', function() { 
                setTimeout(function() {
                    App.Utils.lazyload()
                }, 300);
            });
        } else this.isotope.isotope('layout');
    },
    enableYoutubePlayer: function() {
        if (typeof(YT) !== "undefined") return false;
        $("#youtubeplayer").remove();
        var tag = document.createElement('script');
        tag.id = "youtubeplayer";
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        return true;
    },
    renderRatings: function() {
        if (undefined != this.model.get("rt_ratings") && this.model.get("rt_ratings") != "") {
            var link = this.model.get("rt_links").alternate;
            var rating = this.model.get("rt_ratings").critics_score;
            if (rating == -1) rating = this.model.get("rt_ratings").audience_score;
            this.$("#rtratings").empty().append('<a target="_blank" href="' + link + '"><span class="icon rottentomato"></span><span>' + rating + '%</span></a>');
        }
        return this;
    },
    render: function() {

        this.$el.empty().append(this.template(this.model.toJSON()));

        this.isotope = false;
        setTimeout(function() {
            this.startCarousel();
            //this.model.fetchRT();
            App.Utils.lazyload();

            //  this.enableAddThis();
        }.bind(this), 300);
        setTimeout(function() {
            this.enableYoutubePlayer();
            this.enableRatings();
            this.enableComments();

            App.Utils.lazyload();
        }.bind(this), 1000);
        return this;

    },
    playTrailer: function(e) {
        if (e) e.preventDefault();
        $("#gallery-swiper-container").velocity("fadeOut", {
            duration: 400,
            /* Log all the animated divs. */
            complete: function(elements) {
                if (!this.trailerView) {
                    this.trailerView = new App.Views.TrailerView({
                        model: this.model
                    });
                    this.listenTo(this.trailerView, "play:movie", this.playMovie, this);
                    this.listenTo(this.trailerView, "trailer:close", this.closeTrailer, this);
                } else {
                    this.trailerView.model.set(this.model.toJSON());
                }
                this.trailerView.playTrailer();
            }.bind(this)
        });
        e.stopPropagation();
    },
    closeTrailer: function(e) {
        if (e) e.preventDefault();
        if (this.trailerView) this.trailerView.close();
        this.showCarousel();

        if (e) e.stopPropagation();
    },
    playMovie: function(e) {
        if (e) e.preventDefault();
        if (e) e.stopPropagation();

        if (!app.user.hasProduct(this.model)) {
            this.showCarousel();
            this.purchaseView = new App.Views.PurchaseView({
                model: this.model,
                session: app.session
            })
            return false;
        }


        if (app.player.content.get('id') > 0 && app.player.content.get("id") == this.model.get("id")) {
                this.playerView.render();
                this.hideCarousel();
                app.player.player.init(app.player.player.playlist);
                this.playerView.model.trigger("player:ready", app.movieview.playerView.model);
                if (e) e.stopPropagation();
                return false;
        }

        if (this.playerView && app.player.content) {
            this.playerView.close();
            this.stopListening(this.playerView);
        }

        this.playerView = new App.Views.PlayerView({
            model: app.player
        });

        app.player.load(this.model);
        this.listenTo(this.playerView, 'player:close', this.closePlayer, this);

        this.hideCarousel();

        $("#close-player").show();

        return false;
    },
    closePlayer: function(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        this.playerView.close();
        this.playerView.model.stop();

        this.showCarousel();
    },
    showCarousel: function() {
        $("#close-player").hide();
        $("#gallery-swiper-container").velocity("fadeIn", {
            duration: 300
        });
    },
    hideCarousel: function() {
        $("#gallery-swiper-container").velocity("fadeOut", {
            duration: 300
        });
    },
    changeTab: function(e) {
        e.preventDefault();
        var attr = $(e.currentTarget).attr("data-rel");
        var el = $("#" + attr);
        if ($(el).hasClass("active")) return false;
        $(el).siblings().removeClass("active").hide();
        $(el).addClass("active");
        $(el).show();
        setTimeout(function() {
            App.Utils.lazyload();
            this.applyIsotope();
        }.bind(this), 400);
        return false;
    },
    startCarousel: function() {
        if (_.size(this.model.get("images").backdrops) < 2) {
            $("#moviepage .arrow-left, #moviepage .arrow-right").css("visibility", "hidden");
        } else { 
            window.myMovieSwiper = $('#gallery-swiper-container').swiper({
                //Your options here:
                mode: 'horizontal',
                cssWidthAndHeight: false,
                pagination: '.pagination-1',
                paginationClickable: true,
                createPagination: true,
                onSlideChangeStart: function(e) {}
            });
            $('#moviepage .arrow-left').show().on('click', function(e) {
                e.preventDefault()
                myMovieSwiper.swipePrev();
            });
            $('#moviepage .arrow-right').show().on('click', function(e) {
                e.preventDefault()
                myMovieSwiper.swipeNext();
                App.Utils.lazyload();
            });
        }
        window.filmnavSwiper = new Swiper('#film-tabbar-swiper-container', {
            slidesPerView: 'auto',
            mode: 'horizontal',
            loop: false,
            centeredSlides: true,
            cssWidthAndHeight: true,
            onTouchEnd: function(e) {
                var idx = e.activeIndex;
                $("#film-tabbar-swiper-container .swiper-wrapper .swiper-slide:nth-child(" + (idx + 1) + ")").click();
            },
        });
        $("#film-tabbar-swiper-container .swiper-slide").each(function(item) {
            $(this).click(function(e) {
                e.preventDefault();
                filmnavSwiper.swipeTo(item);
            })
        });
    }
});