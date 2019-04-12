// Global Require.js setup

require.config({
	waitSeconds: 30,
	baseUrl: (typeof(webs) !== 'undefined' ? webs.props.globalAssetBaseURL : (top.webs ? top.webs.props.globalAssetBaseURL : '')) + '/active-static/target/', // jscs:ignore maximumLineLength
	paths: {

		// require
		'link': '../lib/require/link',
		'text': '../lib/require/text',
		'json': '../lib/require/json',

		// jquery
		'jquery': 'https://ajax.googleapis.com/ajax/libs/jquery/1.8/jquery.min',

		// mapbox
		'mapbox': '../lib/mapbox',

		// backbone
		'backbone': '../lib/backbone/backbone',
		'marionette': '../lib/backbone/backbone.marionette',
		'backbone.marionette': '../lib/backbone/backbone.marionette',
		'backbone.validations': '../lib/backbone/backbone.validations',
		'backbone.relations': '../lib/backbone/backbone.relations',
		'backbone.localstorage': '../lib/backbone/backbone.localstorage',

		// spine
		'spine': '../lib/spine/spine.min',
		'spine.min': '../lib/spine/spine.min',
		'spine.list': '../lib/spine/lib/spine.list',
		'spine.manager': '../lib/spine/lib/spine.manager',
		'spine.route': '../lib/spine/lib/spine.route',
		'spine.scrollbar': '../lib/spine/lib/spine.scrollbar',
		'spine.tabs': '../lib/spine/lib/spine.tabs',

		// dust
		'dust': '../lib/dust/dustLoader',
		'dust-full': '../lib/dust/dust-full',
		'dust-core': '../lib/dust/dust-core',

		// handlebars
		'handlebars': '../lib/handlebars/handlebars',
		'handlebars.helpers': '../lib/handlebars/handlebars.helpers',

		// jquery plugins
		'jquery.clockCountdown': '../lib/jquery.clockCountdown',
		'jquery.cropper': '../lib/jquery.cropper',
		'jquery.cssSelect': '../lib/jquery.cssSelect',
		'jquery.customDropdown': '../lib/jquery.customDropdown',
		'jquery.customRange': '../lib/jquery.customRange',
		'jquery.customSelect': '../lib/jquery.customSelect',
		'jquery.dragger': '../lib/jquery.dragger',
		'jquery.dragIt': '../lib/jquery.dragIt',
		'jquery.easing': '../lib/jquery.easing',
		'jquery.errorHighlighter': '../lib/jquery.errorHighlighter',
		'jquery.fileupload': '../lib/jquery.fileupload',
		'jquery.highlight': '../lib/jquery.highlight',
		'jquery.hotkeys': '../lib/jquery.hotkeys',
		'jquery.iframe-transport': '../lib/jquery.iframe-transport',
		'jquery.iframeResizer': '../lib/jquery.iframeResizer',
		'jquery.imagesLoaded': '../lib/jquery.imagesLoaded',
		'jquery.loadingSpinner': '../lib/jquery.loadingSpinner',
		'jquery.numberInput': '../lib/jquery.numberInput',
		'jquery.panner': '../lib/jquery.panner',
		'jquery.payment': '../lib/jquery.payment',
		'jquery.placeholder': '../lib/jquery.placeholder',
		'jquery.postmessage': '../lib/jquery.postmessage',
		'jquery.progressBar': '../lib/jquery.progressBar',
		'jquery.resize': '../lib/jquery.resize',
		'jquery.resizer': '../lib/jquery.resizer',
		'jquery.rotate': '../lib/jquery.rotate',
		'jquery.scrollFixer': '../lib/jquery.scrollFixer',
		'jquery.serializeForm': '../lib/jquery.serializeForm',
		'jquery.sortable': '../lib/jquery.sortable',
		'jquery.ui.widget': '../lib/vendor/jquery.ui.widget',
		'jquery.uploader': '../lib/jquery.uploader',
		'jquery.watch': '../lib/jquery.watch',
		'jquery.zoomer': '../lib/jquery.zoomer',
		'jquery.rotator': '../lib/jquery.rotator',

		// moment
		'moment': '../lib/moment/moment',
		'moment-langs': '../lib/moment/lang',
		'moment-loc': '../lib/moment/moment-loc',

		// localization
		'translate': '../lib/translate/translate',
		'globalize': '../lib/globalize/globalize',
		'globalize_culture': '../lib/globalize/globalize_culture',
		'globalize-loc': '../lib/globalize/globalize-loc',
		'cultures': '../lib/globalize/cultures',

		// other lib
		'underscore': '../lib/backbone/underscore',
		'd3': '../lib/d3/d3.v2',
		'aight': '../lib/d3/aight',
		'cookies': '../lib/cookies',
		'es5-shim': '../lib/es5-shim.min',
		'debug': '../lib/debug',
		'datePicker': '../lib/datePicker/js/glDatePicker',
		'highcharts': '../lib/highcharts/highcharts.min',
		'select2': '../lib/select2/select2',
		'css_browser_selector': '../lib/css_browser_selector_dev',
		'nodeDataTooltip': '../lib/nodeDataTooltip',
		'waypoints': '../lib/waypoints.min',
		'iDropper': '../lib/iDropper/iDropper',
		'zenbox': 'http://asset0.zendesk.com/external/zenbox/v2.3/zenbox',
		'mixpanel': 'internal/sitebuilder/common/mixpanel',
		'mixpanel-2.2': 'internal/sitebuilder/common/mixpanel-2.2',

		// stuff in global
		'less': '../../static/global/js/less-1.3.0.min',
		'glossary_en': '../../static/global/2010/translation/glossary_en',
		'domainLookup': '../../static/global/js/domainLookup',
		'ptpDomainLookup': '../../static/global/js/ptpDomainLookup',
		'websVisitorService': '../../static/global/js/webs/visitor/visitorservice',
		'jquery.jplayer': '../../static/global/js/jquery/plugins/jplayer2/jquery.jplayer.min',
		'debounce': '../../static/global/js/debounce',
		'jquery.customSelect.global': '../../static/global/js/jquery/customSelect',

		// test stuff
		'mockjax': '../test/fixtures/jquery.mockjax',
		'sinon': '../test/fixtures/sinon',

		// stuff that shouldn't be in bootstrap (we should use the full path instead)
		'notifications': 'site/notification/notificationLoader',
		'ThemePickerController': '../../static/global/js/webs/themepicker',
		'finch/ui/base': '../../static/projects/finch/css/base',
		'Browser': '../../JS/BrowserDefine'
	}
});
