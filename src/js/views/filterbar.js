App.Views.SearchView = Backbone.View.extend({ 
    el: "#search-text",
    initialize: function(options) {
        options = options ||  {};
        this.model = options.model;
        this.listenTo(this.model, "change:q", this.setTerm, this);
        this.setTerm(this.getTerm());
        
    },
    getTerm: function() { 
        return this.model.get("q");
    },
    setTerm: function(term) { 

        if (this.getTerm().length > 0) { 
            this.$el.show();

        } else {
            var height = $("#front-page-slider").height();
            this.$el.css({"height": height});
        }
        this.render();

    },
    render: function() {   
        this.$el.html(ich.searchTextTemplate({
            'term': this.getTerm()
        }));
        return this;
    }
});
App.Views.FilterView = Backbone.View.extend({

    initialState: false,
    initialize: function(options) {
        this.options = options;
        this.initialState = options.initialState;
        this.filterlistview = new App.Views.FilterlistView({
            filters: this.options.filters,
            sort: this.options.sort,
            initialState: this.initialState,
        });
        this.filterbarview = new App.Views.FilterbarView({
            filters: this.options.filters,
            sort: this.options.sort,
            initialState: this.initialState
        });
        this.listenTo(this.options.state, 'change', this.updateUI, this);
        this.filterlistview.bind('filter-bar:toggle', this.onChangeFilter, this);
        this.filterlistview.bind('filter-bar:clear', this.onClearFilter, this);
        this.filterlistview.bind('filter-bar:sort', this.onChangeSort, this);
        _.bindAll(this, 'render');
    },
    onChangeSort: function(val, desc) {
        this.trigger("filter-bar:sort", val, desc);
    },
    onClearFilter: function() {
        this.trigger("filter-bar:clear");

    },
    onChangeFilter: function(field, val) {
        // Cache selector for better performance
        var $field = $("#id_" + field);
        var $options = $field.find("option");
        
        $options.each(function() {
            var $this = $(this); // Cache $(this) for reuse
            if (val === "reset") {
                $this.attr("selected", this.value !== "" ? false : "selected");
            } else if (this.value === val) {
                var sel = $this.attr("selected");
                $this.attr("selected", !sel ? "selected" : false);
            }
        });
        $field.trigger("change");
    },
    updateUI: function() {
        var _this = this;
        var $clearButton = $("button.clear");
        
        // Update clear button state
        if (this.options.state.isDefault() === true) { 
            $clearButton.addClass("disabled");
        } else {
            $clearButton.removeClass("disabled");
        }

        // Optimize filter updates with cached selectors
        $.each(this.options.filters, function(option, idx) {
            var val = decodeURIComponent(_this.options.state.get(option));
            var $select = $('#id_' + option);
            var $wrapper = $(".selection-wrapper[data-field='" + option + "']");

            if (val !== "undefined" && val !== "") {
                var parts = val.split(';');

                if (parts.length > 0 && parts !== "undefined") {
                    // Cache DOM queries outside the loop
                    var $divs = $wrapper.find('div');
                    var $resetDiv = $wrapper.find('div[data-val=reset]');
                    
                    $.each(parts, function(idx, item) {
                        $select.find('option[value="' + item + '"]').attr('selected', 'selected');
                        $wrapper.find('div[data-val=' + item + ']').addClass("toggle-on");
                    });
                    $resetDiv.removeClass("toggle-on");
                } 
            } else {
                $select.find('option').attr('selected', false);
                $wrapper.find('div').removeClass("toggle-on");
                $wrapper.find('div[data-val=reset]').addClass("toggle-on");
            }
        });
        
        var query = this.options.state.get('q');
        $('#main-search-box').val(query).trigger("keypress"); 
    },
    render: function() {
        this.filterbarview.render();
        this.filterlistview.render();
        this.updateUI();
        return this;
    }

});

App.Views.FilterItemView = Backbone.View.extend({
    selectEl: '',
    tagName: 'div',
    filters: [],
    events: {
        'click .selection': 'toggleSelection'

    },
    initialize: function(options) {
        this.options = options || {};
        this.selectEl = options.selectEl;
        this.el = options.el;

        this.filters = options.filters;
        this.initDropDown();
    },
    toggleSelection: function(e) {
        e.preventDefault();
        var el = $(e.currentTarget);
        var val = el.attr("data-val");
        var field = el.parent().attr("data-field");
        var type = el.attr("data-type");
        var category = el.attr("data-category");
        var radio = $(el).hasClass("radio");

        if (val === "reset") {
            $(el).addClass("toggle-on").siblings().removeClass("toggle-on");  
        } else {
            $(el).toggleClass("toggle-on");
            $(el).parent().find('.reset').removeClass("toggle-on");
            $(el).parent().find('.radio').removeClass("toggle-on");

        }

        if ($(el).parent().find(".toggle-on").length === 0) {
            $(el).parent().find('.reset').addClass("toggle-on");
        }

        this.trigger("filter-bar:toggle", val, field);

        e.stopPropagation();
        
        return false;
    },

    initDropDown: function() {
        var _this = this;
        var el = this.selectEl;
        var $select = $('<select id="id_' + el + '" multiple></select>').appendTo("#filter-elements");

        if (this.filters.length > 0) {
            // Use DocumentFragment for optimal DOM performance
            var fragment = document.createDocumentFragment();
            
            // Add "All Genres" option
            fragment.appendChild(new Option('All Genres', ''));
            
            // Build all filter options
            this.filters.each(function(filter) {
                var option = document.createElement('option');
                option.value = filter.get("id");
                option.setAttribute('data-val', filter.get("id"));
                option.text = filter.get("name");
                fragment.appendChild(option);
            });
            
            // Single DOM operation with all options at once
            $select[0].appendChild(fragment);
        }
    },
    render: function() {

        this.$el.html(ich.checkboxlistTemplate({
            'items': this.filters.toJSON(),
            'group': this.selectEl
        }));

        return this;
    }

});
App.Views.SortItemView = App.Views.FilterItemView.extend({

    toggleSelection: function(e) {
        e.preventDefault();
        var el = $(e.currentTarget);
        var val = el.attr("data-val");
        var desc = el.attr("data-desc");

        $(el).addClass("toggle-on");
        $(el).siblings().removeClass("toggle-on");
        this.trigger("filter-bar:sort", val, desc);

    },
    render: function() {
        this.$el.html(ich.radiolistTemplate({
            'items': this.filters.toJSON()
        })); 
        return this;
    }

});
App.Views.ClearFiltersView = Backbone.View.extend({
    template: '<a href="#"><button class="clear btn" href="#">' + tr("Clear") + '</button></a>',
    events: {
        'click button': 'onClear'
    },

    initialize: function(options) {
        this.options = options || {};
        this.el = options.el;
        this.render();
    },
    onClear: function(e) {
        e.preventDefault();
        this.trigger("filter-bar:clear");
        return false;
    },
    render: function() {
        this.$el.html(_.template(this.template));
        return this;
    }

});

App.Views.FilterlistView = Backbone.View.extend({
    views: [],
    initialState: true,
    initialize: function(options) {
        _.bindAll(this, "render");
        this.options = options || {};
        this.filters = options.filters;
        this.initialState = options.initialState;
        this.sort = options.sort;
    },
    onFilterBarButton: function(val, field) {
        this.trigger("filter-bar:toggle", field, val);

    },
    onSortButton: function(val, desc) {
        this.trigger("filter-bar:sort", val, desc);

    },
    onClearButton: function() {

        this.trigger("filter-bar:clear");

    },
    render: function() {

        this.setElement($("#filter-list"));
        var _this = this;

        var i = 0;
        var disp = this.initialState ? "block" : "none";

        if (App.Settings.sortingEnabled) {  
            /** Add sortbar */

            $("<div>").attr("id", "sort-list").css("display", disp).appendTo(this.$el);
            var view = new App.Views.SortItemView({
                filters: this.sort,
                selectEl: "sort",
                el: '#sort-list'
            });
            view.on('filter-bar:sort', this.onSortButton, this);

            this.$el.append(view.render().$el);
            this.views.push(view);
            disp = "none";
        } 

        /** Add filters */
        
        _.each(this.filters, function(items, id) {
            var name = id + "-list"
            $("<div>").attr("id", name).css("display", disp).appendTo(_this.$el);
            disp = "none";
            var view = new App.Views.FilterItemView({
                filters: items,
                selectEl: id,
                el: '#' + name
            });
            view.on('filter-bar:toggle', _this.onFilterBarButton, _this);
            _this.$el.append(view.render().$el);
            _this.views.push(view);
        });
        
        $(".selection.list").each(function() { $(this).prependTo($(this).parent()); });
        // Clear filters view
        // 
        $("<div>").attr("id", "clear-list").css("display", "none").appendTo(this.$el);
        var clearview = new App.Views.ClearFiltersView({
            el: '#clear-list'
        });
        clearview.on("filter-bar:clear", this.onClearButton, this);
        this.views.push(clearview);

        return this;
    }
});

App.Views.FilterbarView = Backbone.View.extend({
    activeClass: 'active swiper-slide-active',
    swipeContainerId : '#front-tabbar-swiper-container',
    events: {
        'click .swiper-slide': 'toggleFilter'
    },
    state: true,

    initialize: function(options) {
        _.bindAll(this, "render");
        this.options = options || {};
        this.initialState = this.state = options.initialState;

    },
    render: function() {
        this.setElement($("#filter-bar"));

        this.$el.html(ich.filterBarTemplate({sortbar: App.Settings.sortingEnabled}));
        
        /* Show or hide the initial tab */
        if (this.initialState) { 
            this.$(".swiper-slide:first").addClass(this.activeClass);
        } else {             
           $("#filter-list").slideUp();
        }

        var _this = this;

        setTimeout(function() { 
            _this.enableCarosel();
        }, 350);

        return this;
    },
    toggleFilter: function(e) {

        e.preventDefault();

        var el = e.currentTarget;
        var attr = $(el).attr("data-rel");
        var filterEl = $("#" + attr);

        $(filterEl).siblings().hide();

        if ($(el).hasClass("active")) {
            this.closeFilterBar();
            $(el).removeClass(this.activeClass);
        } else {
            $(filterEl).show();
            $(el).addClass(this.activeClass);
            this.openFilterBar();
        }

        $(el).siblings().removeClass(this.activeClass);
        e.stopPropagation();
        return false;

    },

    /* Initialize carousel */

    enableCarosel: function() {
        window.frontnavSwiper = new Swiper(this.swipeContainerId, {
            slidesPerView: 'auto',
            mode: 'horizontal',
            loop: false,
            centeredSlides: true,
            moveStartThreshold: 5,
            slideActiveClass: "activeslide",
            cssWidthAndHeight: true,

        });

        $(this.swipeContainerId +" .swiper-slide").each(function(item) {
            $(this).click(function() {
                frontnavSwiper.swipeTo(item)
            })
        });

    },
    openFilterBar: function() {
        if (this.state) return;
        this.state = true;
        $("#filter-list").slideDown();
    },
    closeFilterBar: function() {
        if (!this.state) return;
        this.state = false;
        $(this.swiperContainerId + " .swiper-slide-active").removeClass("swiper-slide-active");
        $("#filter-list").slideUp();
    },

});