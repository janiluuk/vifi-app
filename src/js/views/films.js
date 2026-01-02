App.Views.FilmView = Backbone.View.extend({
    model: App.Models.Film,
    tagName: "div",
    className: "item",
    events: {
        "click ": "showMoviePage"
    },
    initialize: function() {
        this.listenTo(this.model, "change", this.render, this);
        this.listenTo(this.model, "remove", this.remove, this);
        this.listenTo(this.model, "destroy", this.remove, this);
        if (this.model.get("modified_days") >= 0) {
            this.model.set("is_new", 1);
        }
    },
    render: function() {
        this.$el.html(ich.filmitemTemplate(this.model.toJSON()));
        return this;
    }
});
_.extend(App.Views.FilmView.prototype, {
    showMoviePage: function(e) {
        e.preventDefault();
        var url = this.model.get("seo_friendly_url");
        app.router.navigate(url, {
            trigger: true
        });
        return false;
    }
});
App.Views.UserFilmView = Backbone.View.extend({
    model: App.User.Ticket,
    tagName: "div",
    className: "item",
    events: {
        "click a": "showMoviePage",

    },
    initialize: function() {
        this.listenTo(this.model, "change", this.render, this);
        this.listenTo(this.model, "remove", this.remove, this);
    },
    showMoviePage: function(e) {
        app.quickmenu.trigger("quickbar:close");
        var film = app.collection.originalCollection.get(this.model.get("id"));
        if (typeof film === "undefined") return false;
        var url = film.get("seo_friendly_url");
        app.router.showFilm(film.get("id"), true);
        e.preventDefault();
        return false;
    },
    render: function() {
        if (this.model.isExpired()) {return this;}
        var filmitem = app.collection.originalCollection.get(this.model.get("vod_id"));
        if (filmitem) {
        this.model.set("poster_url", filmitem.get("poster_url"));
        this.model.set("seo_friendly_url", filmitem.get("seo_friendly_url"));
        this.$el.html(ich.userfilmitemTemplate(this.model.toJSON()));
        }
        return this;
    }
});
App.Views.UserEventView = Backbone.View.extend({
    model: App.User.Ticket,
    tagName: "div",
    className: "item",
    events: {
        "click a": "showEventPage",

    },
    initialize: function() {
        this.listenTo(this.model, "change", this.render, this);
        this.listenTo(this.model, "remove", this.remove, this);
    },
    showEventPage: function(e) {
        app.quickmenu.trigger("quickbar:close");
        var event = app.usercollection.get(this.model.get("id"));
        if (typeof event === "undefined") return false;
        var url = event.get("seo_friendly_url");
        app.router.showEvent(event.get("id"), true);
        e.preventDefault();
        return false;
    },
    render: function() {
        if (this.model.isExpired()) {return this;}
        var item = app.usercollection.get(this.model.get("id"));
        console.log(item);

        if (item && item.content) {
            var images = item.content.get("images");
        this.model.set("seo_friendly_url", item.content.get("seo_friendly_url"));         
        this.model.set("poster_url", images.poster);
        this.model.set("validtotext", item.content.get("starttime") + ' - ' + item.content.get("endtime"));


        this.$el.html(ich.usereventitemTemplate(this.model.toJSON()));
        }
        return this;
    }
});

