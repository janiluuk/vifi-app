App.Views.FeaturedView = Backbone.View.extend({
    swiperel: '#featured-slides',
    el: '#front-page-slider',
    collection: App.Collections.PaginatedCollection,
    initialized: false,
    initialize: function(options) {
        this.querystate = options.querystate;
        this.fragment = document.createDocumentFragment();
        this.banners = options.banners;
        this.listenTo(this.querystate, "change:q", this.onQueryChange, this);
        if (this.querystate.get("q").length > 0) {
            this.$el.hide();
        }
    },
    onQueryChange: function() {
        if (this.querystate.get("q").length > 0) {
            this.trigger("search:open");
        } else {
            this.trigger("search:close");
        }
    },
    resetView: function() {
        setTimeout(function() {
            this.$el.empty();
            this.render();
        }.bind(this), 85);
    },
    render: function() {
        this.$el.empty().append(ich.featuredTemplate());
        var counter = 0;
        this.banners.forEach(function(item) {
            $(this.fragment).append(ich.bannerItemTemplate(item.toJSON()));
            counter++;
        }.bind(this));
        _.each(this.collection, function(item) {
            if (counter < App.Settings.Featured.featured_slides_limit) {
                counter++;
                var overview = item.get('overview');
                var shortOverview = item.get('shortOverview');
                if (overview !== null)
                    if (_.isEmpty(shortOverview)) {
                        shortOverview = item.get('overview').substr(0, 210) + "...";
                        item.set("shortOverview", shortOverview);
                    }
                $(this.fragment).append(ich.featuredItemTemplate(item.toJSON()));
            }
        }.bind(this));
        $(this.swiperel).empty().append(this.fragment);
        if (counter < 2) {
            this.$(".arrow-left, .arrow-right").hide();
        } else {
            setTimeout(function() {
                this.startCarousel();

            }.bind(this), 1000);
        }

        return this;
    },
    startCarousel: function() {
        window.mySwiper = new Swiper('#featured-swiper-container', {
            //Your options here:
            mode: 'horizontal',
            loop: true,
            pagination: '.pagination',
            autoplay: App.Settings.Featured.featured_slides_autoplay_interval,
            paginationClickable: true,
            createPagination: true,
            onSlideChangeStart: function(e) {
                App.Utils.lazyload();
            }
        });
        $('#featured-swiper-container .arrow-left').on('click', function(e) {
            e.preventDefault();
            mySwiper.swipePrev();
        });
        $('#featured-swiper-container .arrow-right').on('click', function(e) {
            e.preventDefault();
            mySwiper.swipeNext();
        });
    }
});
App.Views.BrowserPage = Backbone.View.extend({
    model: App.Models.Film,
    el: '#browser-content',
    events: {
        'change #search-form select': 'onSearchFieldChange',
        'change #search-form input[type="hidden"]': 'onSearchFieldChange',
        'keyup #search-form input[type="text"]': 'debouncedSearchFieldChange',
        'change #search-form input[type="text"]': 'onSearchFieldChange',
        'click #loadMore': 'onLoadMore'
    },
    initialize: function(options) {
        this.options = options;
        this.collection = options.collection;
        this.collection.options.genres.bind('all', this.setGenreDropDown, this);
        this.collection.fullCollection.bind('reset', this.renderResults, this);
        this.collection.querystate.bind('change', this.onChangeCollectionState, this);
        this.collection.querystate.bind('change:genres', this.onChangeGenre, this);
        this.collection.querystate.bind('change:durations', this.onChangeDuration, this);
        this.collection.querystate.bind('change:years', this.onChangeYear, this);
        this.filterview = new App.Views.FilterView({
            filters: this.options.filters,
            sort: this.options.sort,
            state: this.collection.querystate,
            initialState: options.initialState
        });
        this.filterview.bind('filter-bar:sort', this.onSort, this);
        this.filterview.bind('filter-bar:clear', this.onClear, this);
        this.searchview = new App.Views.SearchView({
            model: this.collection.querystate
        });
        this.searchview.render();
        _.bindAll(this, 'render', 'renderResults', 'initEvents', 'applyIsotope');
        
        // Create debounced version of search field change handler for better performance
        // Reduces API calls and improves responsiveness with 400ms delay
        this.debouncedSearchFieldChange = _.debounce(this.onSearchFieldChange, 400);
        
        this.initEvents();
    },
    initEvents: function() {
        this.on("maximize", function() {
            var height = this.originalHeight;
            var altHeight = $("#featured-swiper-container").height();
            height = Math.max(height, altHeight);
            $("#front-page-slider").css({
                "min-height": height,
                "height": height,
                "opacity": 0
            });
            $("#search").velocity({
                "opacity": 0,
                "height": height,
                "min-height": height
            }, 200, false, function() {
                $(this).hide();
                $("#front-page-slider").show().velocity({
                    "opacity": 1
                }, 400, false, function() {
                    setTimeout(function() { 
                        if (window.mySwiper) window.mySwiper.resizeFix();
                    }, 250);
                }.bind(this));
            });
        });
        this.on("minimize", function() {
            this.originalHeight = $("#front-page-slider").height();
            var height = $(".feature-wrapper#search").css("min-height");
            $("#search").css({
                "height": height,
                "min-height": height,
                "opacity": 0
            });
            $("#front-page-slider").velocity({
                "min-height": height,
                "height": height,
                "opacity": 0
            }, 325, false, function() {
                $("#search").show().velocity({
                    "opacity": 1
                }, 200);
                $(this).hide();
            });
        });
    },
    render: function() {
        this.$el.html(ich.browserPageTemplate());
        this.filterview.render();
        this.applyIsotope();
        return this;
    },
    applyIsotope: function() {
        /* Enable isotope on the results */
        this.$isotope = $("#content-body-list").isotope({
            layoutMode: 'fitRows',
            resizable: true,
            itemSelector: '#content-body-list .item',
            transitionDuration: '0.7s',
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
                duration: 600,
                queue: false,
            }
        });
        this.$isotope.isotope('on', 'layoutComplete', function() { 
            setTimeout(function() {
                   App.Utils.lazyload();

            }, 300);
        });
        return true;
    },
    setGenreDropDown: function(action) {
        var $genres = $('#id_genres');
        $genres.empty();
        
        if (this.collection.options.genres.length > 0) {
            // Use DocumentFragment for optimal DOM performance
            var fragment = document.createDocumentFragment();
            
            if (this.collection.options.genres.length > 1) {
                fragment.appendChild(new Option('All Genres', ''));
            }
            
            _.each(this.collection.options.genres.models, function(genre, key, list) {
                fragment.appendChild(new Option(genre.get("name"), genre.get("id")));
            });
            
            // Single DOM operation with all options at once
            $genres[0].appendChild(fragment);
            
            this.$('#id_genres option[value="' + this.collection.querystate.get('genres') + '"]').attr('selected', 'selected');
        }
    },
    redirectToBaseURL: function() {
        window.location = '//' + window.location.host + '/#search/' + this.collection.querystate.getHash();
    },
    onChangeDuration: function(model, duration) {
        //This is a state change event, not a dom event
        if (this.options.redirect_on_duration_change && duration !== this.collection.initial_search.duration) {
            this.redirectToBaseURL();
        }
    },
    onChangePeriod: function(model, period) {
        //This is a state change event, not a dom event
        if (this.options.redirect_on_period_change && period !== this.collection.initial_search.period) {
            this.redirectToBaseURL();
        }
    },
    onSort: function(field, desc) {
        this.onLoadingStart();
        this.collection.sortByAttribute(field, desc);
        return false;
    },
    onLoadingStart: function() {
        $("#content-body-list").addClass("fadeDownList");
        setTimeout(function() {
            $("#content-body-list").parent().addClass("loading");
        }, 200);
        return false;
    },
    onLoadingEnd: function() { 
        $("#content-body-list").removeClass("fadeDownList");
        setTimeout(function() {
            $("#content-body-list").parent().removeClass("loading");
        }, 350);
        return false;
    },
    onClear: function(e) {
        this.collection.querystate.set(this.collection.querystate.defaults);
        this.onChangeCollectionState(this.collection.querystate, true);
        return false;
    },
    onChangeGenre: function(model, genre) {
        // this function is a model state change, not the dom event: change
        // because of this we don't need the "event" arg.
        var parts = app.homepage.collection.querystate.get('genres');
        if (undefined === parts || parts.length === 0) return false;
        _.each(parts.split(";"), function(i) {
            $(".selection-wrapper [data-val=" + i + "]")
        });
        if (this.options.redirect_on_genre_change && genre !== this.collection.initial_search.genre) {
            this.redirectToBaseURL();
        }
    },
    onSearchFieldChange: function(event) {
        this.onLoadingStart();
        var value = $("#main-search-box").val();
        var search_dict = {
            q: value,
            genres: undefined,
            periods: undefined,
            durations: undefined
        };
        
        // Optimize selector - use :selected instead of attribute selector and cache form
        var $searchForm = $("#search-form");
        $searchForm.find("select option:selected").each(function() {
            var $this = $(this);
            var $parent = $this.parent();
            var fieldid = $parent.attr("id");
            var fieldname = fieldid.replace("id_", "");
            var val = $this.val();
            search_dict[fieldname] = search_dict[fieldname] === undefined ? val : search_dict[fieldname] += ";" + val;
        });
        
        if (JSON.stringify(search_dict) !== JSON.stringify(this.collection.querystate.attributes)) {
            this.collection.querystate.set(search_dict);
        } else {
            this.onLoadingEnd();
        }
    },
    addOne: function(item) {
        var view = new App.Views.FilmView({
            model: item
        });
        return view.render().el;
    },
    addSet: function(collection) {
        var container = document.createDocumentFragment();
        var _this = this;
        var items = [];
        collection.each(function(film, id) {
            var el = _this.addOne(film);
            items.push(el);
            container.appendChild(el);
        });
        this.$isotope.append(container).isotope('insert', items);
        return true;
    },
    onLoadMore: function(e) {
        e.preventDefault();
        $("#loadMore").addClass("loading");
        setTimeout(function() {
            if (this.addSet(this.collection.getNextPage())) {
                $("#loadMore").removeClass("loading");
            }
            if (!this.collection.hasNextPage()) {
                $("#loadMore").hide();
            }
        }.bind(this), 300);
        return false;
    },
    renderResults: function(force) {
        if (typeof(force) === "undefined" && ((typeof(this.lastattributes) !== "undefined") || this.lastattributes === JSON.stringify(this.collection.querystate.changedAttributes()))) {
            return false;
        }
        if (!this.rendering) {
            this.rendering = true;
            $("#content-body-list").addClass("fadeDownList").empty().parent().addClass("loading");
            this.$isotope.isotope("reloadItems");
            this.collection.getFirstPage();
            /* Empty result set */
            if (this.collection.length === 0) {
                $("#content-body-list").append(ich.emptyListTemplate({
                    text: tr("No results")
                })).parent().removeClass("loading");
            }
            this.addSet(this.collection);
            if (!this.collection.hasNextPage()) {
                $("#loadMore").hide();
            } else {
                $("#loadMore").show();
            }
            this.lastattributes = JSON.stringify(this.collection.querystate.changedAttributes());
            this.rendering = false;
        }
        this.onLoadingEnd();
        return false;
    },
    onChangeCollectionState: function(state, silent) {
        var trigger = silent === true ? false : true;
        _.extend(this.collection.queryParams, this.collection.querystate.attributes);
        //Update the url of the browser using the router navigate method
        app.router.navigate('search' + '?' + app.homepage.collection.querystate.getHash(), {
            trigger: trigger
        });
    }
});