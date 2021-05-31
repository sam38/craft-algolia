/**
 * @author Sudarshan Shakya (sam@thespaceinbetween.co.nz)
 * @date 27th Feb 2019
 *
 * This JS-library will add the functionality of search and paginate
 * to the project with ease. The variables can all be configured as
 * per project requirement. This library is dependent on jQuery and
 * algolia library.
 */
var tsibSearch = {
    init: function init(options) {
        /**
         * This is the configuration data for the search to work.
         * It contains 5 objects (algolia, jQuery elements, pagination,
         * result & template), along with some jQuery selectors and
         * reference settings.
         * These data can be overridden when initializing the search
         * with options (as first parameter).
         */
        tsibSearch.data = {
            algolia: {
                app: null, // algolia Application ID
                key: null, // algolia client search key
                index: null, // search index name
                src: 'https://cdn.jsdelivr.net/algoliasearch/3/algoliasearch.min.js', // algolia library source
                urlPrefix: '' // site URL required for results URI prefixes
            },
            elements: { // jQuery selectors
                $form: null, // jQuery instace of the form
                $input: null, // jQuery instance of the keyword input
                $more: null, // jQuery instance of the 'view-more' button/link
                $results: null, // jQuery instance of the search results wrapper
                $status: null, // jQuery instance of the results status
                $title: null // jQuery instance of results title element
            },
            log: true, // boolean to enable/disable tsibSearch logs
            pagination: {
                perPage: 10, // initial number of results to display and load/show more
                showAll: false // paginate or show all results when clicked on more button
            },
            result: { // individual search-result item
                className: 'searchResultsItem',
                blurbLength: 220, // total result blurb length
                blurbLengthWithImage: 120, // total blurb length when image is available
                linkText: '' // generic link text on each item
            },
            templates: {
                blankTitle: 'Enter a \'keyword\' to search',
                blankStatus: 'Enter a \'keyword\' to search',
                title: 'We found {total} result{oneOrMany} for {keyword}.',
                titleEmpty: 'We found no results for {keyword}',
                status: 'Showing {displayed} of {total} result{oneOrMany}',
                statusEmpty: 'No results found'
            },
            type: 'default' // search type: ajax, hot, default
        };

        // Check if algolia has been included
        if (window.algoliasearch) tsibSearch.checkOptions(options);
        else { // Load algolia library
            $.ajax({
                url: tsibSearch.data.algolia.src,
                dataType: 'script',
                success: function() {
                    tsibSearch.log('Algolia library fetch complete.');
                    tsibSearch.checkOptions(options);
                },
                error: function(e) {
                    tsibSearch.log('Unable to fetch algolia library from ' + tsibSearch.data.algolia.src + '!', e);
                }
            });
        }
    },
    /**
     * This method will log the error messages/notices to the browser console
     * This can be turned on/off from the config `data.log`
     *
     * @param message1
     * @param message2
     */
    log: function log(message1, message2) {
        if (!tsibSearch.data.log) return;
        else if (message2) console.log(message1, message2);
        else console.log(message1);
    },
    /**
     * This method will parse and check the supplied configuration options
     *
     * @param options
     */
    checkOptions: function checkOptions(options) {
        var data = tsibSearch.data;
        // Check search configuration options
        if (options === null || typeof options !== 'object') {
            tsibSearch.log('tsibSearch requires Search configuration options `{}` as second parameter.');
            return;
        }

        // Merge options into data
        if (options.hasOwnProperty('elements')) $.extend(data.elements, options.elements);
        if (options.hasOwnProperty('pagination')) $.extend(data.pagination, options.pagination);
        if (options.hasOwnProperty('result')) $.extend(data.result, options.result);
        if (options.hasOwnProperty('templates')) $.extend(data.templates, options.templates);
        // Override config
        if (options.hasOwnProperty('log')) data.log = options.log;
        if (options.hasOwnProperty('type')) data.type = options.type;

        // check if form instance exists
        if (!data.elements.$form.length) {
            tsibSearch.log('The form instance does not exist!');
            return;
        }

        // Check if form jQuery instance is supplied
        if (!data.elements.$form) {
            tsibSearch.log('tsibSearch requires jQuery instance of your search form. e.g. { elements.$form = $(\'#searchFormId\') }');
            return;
        }

        // Check if keyword input is available
        data.elements.$input = data.elements.$form.find('input[type="text"]:eq(0)');
        if (!data.elements.$input.length) {
            tsibSearch.log('Search input not found inside the form!');
            return;
        }

        /**
         * Configure search by $form attributes
         *
         * This will parse the data attribute of the supplied search form
         * and set the Search configuration.
         */
        // total items per page
        var tempAttr = data.elements.$form.attr('data-url');
        if (typeof tempAttr !== typeof undefined && tempAttr !== -1) data.algolia.urlPrefix = tempAttr;

        // Fetch the Algolia app id
        tempAttr = data.elements.$form.attr('data-app');
        if (typeof tempAttr !== typeof undefined && tempAttr !== -1) data.algolia.app = tempAttr;

        // Fetch the Search only api key
        tempAttr = data.elements.$form.attr('data-key');
        if (typeof tempAttr !== typeof undefined && tempAttr !== -1) data.algolia.key = tempAttr;

        // Refer to right search index
        tempAttr = data.elements.$form.attr('data-index');
        if (typeof tempAttr !== typeof undefined && tempAttr !== -1) data.algolia.index = tempAttr;

        // Validate algolia has been setup right.
        if (!data.algolia.app || !data.algolia.key || !data.algolia.index) {
            tsibSearch.log('Algolia hasn\'t been setup correctly! Please provide `app`, `key` and `index`');
            return;
        }

        // Register algolia client and initialize search index
        data.client = algoliasearch(data.algolia.app, data.algolia.key);
        data.index = data.client.initIndex(data.algolia.index);

        // Register event handlers
        tsibSearch.bindEvents();
    },
    /**
     * this method will check if search title, results and status are available.
     */
    checkResultsPageMarkups: function checkResultsPageMarkups() {
        var data = tsibSearch.data;
        // Check if title id exists
        if (!data.elements.$title || !data.elements.$title.length) {
            tsibSearch.log('Please provide options.$title e.g. $(\'#searchResultsTitleId\')');
            return false;
        }

        // Check if results id exists
        if (!data.elements.$results || !data.elements.$results.length) {
            tsibSearch.log('Please provide options.$results e.g. $(\'#searchResultsId\')');
            return false;
        }

        // Check if status id exists
        if (!data.elements.$status || !data.elements.$status.length) {
            tsibSearch.log('Please provide options.$status e.g. $(\'#searchStatusId\')');
            return false;
        }

        // Optional: check for more button
        if (!data.elements.$more || !data.elements.$more.length) {
            tsibSearch.log('[Optional] More button is not configured. This is necessary to paginate your search results.');
        }
        return true;
    },
    /**
     * this method will customize the title as required and update the search
     * results page title.
     * @param content
     */
    updateResultsTitle: function updateResultsTitle(content) {
        var data = tsibSearch.data,
            title;
        if (typeof content === 'string') {
            // search result is empty
            title = content === '' ? data.templates.blankTitle : data.templates.titleEmpty;
            title = title.replace('{keyword}', content);
        } else {
            title = data.templates.title;
            title = title.replace('{keyword}', content.query);
            title = title.replace('{oneOrMany}', (content.hits.length === 1 ? '' : 's'));
            title = title.replace('{total}', content.hits.length);
        }
        data.elements.$title.html(title);
    },
    /**
     * After the search key variables have been validated
     * bind events to register all the search functionality.
     */
    bindEvents: function bindEvents() {
        var data = tsibSearch.data;
        tsibSearch.log(data);
        switch (data.type) {
            // Fetch Results with AJAX and update search results
            case 'ajax':
                data.elements.$form.on('submit', function(e) {
                    e.preventDefault();
                    var val = data.elements.$input.val();
                    if ($.trim(val) === '') {
                        data.elements.$form.addClass('form-error');
                    } else {
                        data.elements.$form.removeClass('form-error');
                        if (tsibSearch.checkResultsPageMarkups()) tsibSearch.buildResults();
                    }
                });
                break;
            // Load results with each key-stroke (AJAX)
            case 'hot':
                data.elements.$input.on('keyup', function(e) {
                    e.preventDefault();
                    var val = data.elements.$input.val();
                    if ($.trim(val) === '') {
                        data.elements.$form.addClass('form-error');
                        e.preventDefault();
                    } else {
                        data.elements.$form.removeClass('form-error');
                        if (tsibSearch.checkResultsPageMarkups()) tsibSearch.buildResults();
                    }
                });
                data.elements.$form.on('submit', function(e) {
                    e.preventDefault();
                });
                break;
            // Default search results update on page reload (after form submission)
            default:
                if (tsibSearch.checkResultsPageMarkups()) tsibSearch.buildResults();
                data.elements.$form.removeAttr('validate').attr('novalidate', true);
                // validate form before submission
                data.elements.$form.on('submit', function(e) {
                    var val = data.elements.$input.val();
                    if ($.trim(val) === '') {
                        data.elements.$form.addClass('form-error');
                        e.preventDefault();
                    } else data.elements.$form.removeClass('form-error');
                });
                break;
        }
        // Bind load more event
        if (data.elements.$more && data.elements.$more.length) {
            data.elements.$more.on('click', function(e) {
                e.preventDefault();
                // show-all or paginate
                var className = data.result.className;
                if (data.pagination.showAll) {
                    data.elements.$results.find('.' + className + '.hidden').removeClass('hidden').addClass(className + 'Appear');
                } else {
                    var total = 0;
                    data.elements.$results.find('.' + className + '.hidden').each(function(i, elm) {
                        if (++total <= data.pagination.perPage) $(elm).removeClass('hidden').addClass(className + 'Appear');
                    });
                }
                tsibSearch.buildResultStats();
            });
        }
    },
    /**
     * this will build the search-results output
     */
    buildResults: function bindResults() {
        var data = tsibSearch.data,
            keyword = data.elements.$input.val(),
            totalResults = 0;
        if (keyword === '') {
            tsibSearch.updateResultsTitle(keyword);
            data.elements.$status.html(data.templates.blankStatus);
        } else {
            data.index.search(data.elements.$input.val(), function(err, content) {
                var result = '';
                tsibSearch.updateResultsTitle(content);
                for (var i = 0; i < content.hits.length; i++) {
                    totalResults++;
                    result += tsibSearch.buildSearchMarkup(content.hits[i], i);
                }
                data.elements.$results.html(result);
                // build status & load-more button
                tsibSearch.data.totalResults = content.hits.length;
                tsibSearch.buildResultStats();
                // when search result is empty
                if (totalResults <= 0) tsibSearch.updateResultsTitle(keyword);
            });
        }
    },
    /**
     * This method will build the search-results stats and
     * update on data.$status wrapper. This will also show/hide
     * `more` button wrapper.
     */
    buildResultStats: function buildResultStats() {
        // count total displayed
        var data = tsibSearch.data,
            hiddenItems = data.elements.$results.find('.' + data.result.className + '.hidden').length,
            totalItems = data.elements.$results.find('.' + data.result.className).length;
        var displayed = totalItems - hiddenItems;
        var title = data.templates.status,
            titleEmpty = data.templates.statusEmpty;
        // parse title vars
        title = title.replace('{displayed}', displayed);
        title = title.replace('{oneOrMany}', (data.totalResults === 1 ? '' : 's'));
        title = title.replace('{total}', data.totalResults);
        title = title.replace('{keyword}', data.elements.$input.val());
        tsibSearch.data.elements.$status.html(displayed <= 0 ? titleEmpty : title);
        // show hide load-more
        if (data.elements.$more && data.elements.$more.length) {
            if (hiddenItems > 0) data.elements.$more.removeClass('hidden');
            else data.elements.$more.addClass('hidden');
        }
    },
    /**
     * This method will build each results item with applicable
     * class selectors for pagination and/or status update.
     *
     * @param row - Search result row object
     * @param i - Search index number
     * @param readMore - Read More text
     * @returns {string}
     */
    buildSearchMarkup: function buildSearchMarkup(row, i) {
        var data = tsibSearch.data,
            dataSelector = data.result.className,
            itemImage = (row.image && row.image !== '') ?
                '<div class="' + dataSelector + '__image" style="background-image: url(\'' + row.image + '\')"></div>' : '';
        var description = '';
        if (row._highlightResult.content) {
            var content = row._highlightResult.content;
            content = content.constructor === Array ? content[0].value : content.value;
            description = tsibSearch.searchDescription(content, row.image);
        }

        var hiddenClass = data.elements.$more && i >= data.pagination.perPage ? 'hidden' : '';
        var result = '<a href="' + row.uri + '" class="' + dataSelector + ' ' + hiddenClass + '">';
        result += itemImage + '<div class="' + dataSelector + '__content"><div class="' + dataSelector + '__title">' + row.title + '</div>';
        result += '<div class="' + dataSelector + '__description">' + description + data.result.linkText + '</div></div></a>';
        return result;
    },
    /**
     * This method will fetch the search result excerpt with appropriate
     * characters length. Result without image is usually longer.
     *
     * @param content
     * @param img
     * @returns {string}
     */
    searchDescription: function searchDescription(content, img) {
        var limit = (img && img !== '') ? tsibSearch.data.result.blurbLengthWithImage : tsibSearch.data.result.blurbLength;
        return content.substr(0, limit) + (content.length > limit ? '...' : '');
    }
};

module.exports.tsibSearch = tsibSearch;
