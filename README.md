# README #

This JS-library will add the functionality of search and paginate to the project with ease. The variables can all be configured as per project requirement. This library is dependent on jQuery and algolia library.

## What is this repository for? ##

This package will help add common functionality of an Algolia search module with a list of common functions like 'load more', 'show all' with ease.

## How do I get set up? ##
To setup tsibSearch, you will need to have a search form with an input field (for keyword input). Along with a form you will also need a list of elements for your load-more button, search results, search status/stats and search results title.

```
<!-- Sample form html -->
<form action="/search" method="get" id="tsibSearchForm" 
      data-app="{ALGOLIA_APPLICATION_ID}"
      data-key="{ALGOLIA_SEARCH_KEY}"
      data-index="{ALGOLIA_INDEX_NAME}"
      data-url="https://example.com/" validate>

    <input type="text" name="k" id="tsibSearchKeyword" maxlength="50" placeholder="Search" autocomplete="off" value="">
    
    <button id="tsibSearchSubmit" type="submit" title="Search">Search</button>
    
    <button id="tsibSearchClose" type="button" title="Close"></button>
    
    <small id="tsibSearchError">Enter a `keyword` to search.</small>
</form>
``` 

tsibSearch requires Algolia application id, search key and, index name as a data attribute of the form.

### Configuration Options ###
```
// Import tsibSearch package
import { tsibSearch } from 'craft-algolia-search';

// Configure search options
let options = {
    elements: { // jQuery selectors
        $form: null, // jQuery instace of the form
        $more: null, // jQuery instance of the 'view-more' button/link
        $results: null, // jQuery instance of the search results wrapper
        $status: null, // jQuery instance of the results status
        $title: null, // jQuery instance of results title element
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
        blankTitle: 'Enter a "keyword" to search',
        blankStatus: 'Enter a "keyword" to search',
        title: 'We found {total} result{oneOrMany} for {keyword}.',
        titleEmpty: 'We found no results for {keyword}',
        status: 'Showing {displayed} of {total} result{oneOrMany}',
        statusEmpty: 'No results found'
    },
    type: 'default' // search type: ajax, hot, default
};

// Initialize tsibSearch
tsibSearch.init(options);
```

tsibSearch requires all the elements to work correctly, while other config options have a default value.


### Dependencies ###
jQuery 3.*.*, algoliasearch (CDN: https://cdn.jsdelivr.net/algoliasearch/3/algoliasearch.min.js)


### Who do I talk to? ###

* Admin
Sudarshan Shakya (inbox.sam38@gmail.com)
