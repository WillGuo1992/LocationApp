/**
 * @author zhixin wen <wenzhixin2010@gmail.com>
 * version: 1.10.1
 * https://github.com/wenzhixin/bootstrap-table/
 */

!function ($) {
    'use strict';
    // TOOLS DEFINITION
    // ======================

    var cachedWidth = null;

    // it only does '%s', and return '' when arguments are undefined
    var sprintf = function (str) {
        var args = arguments,
            flag = true,
            i = 1;

        str = str.replace(/%s/g, function () {
            var arg = args[i++];

            if (typeof arg === 'undefined') {
                flag = false;
                return '';
            }
            return arg;
        });
        return flag ? str : '';
    };

    var getPropertyFromOther = function (list, from, to, value) {
        var result = '';
        $.each(list, function (i, item) {
            if (item[from] === value) {
                result = item[to];
                return false;
            }
            return true;
        });
        return result;
    };

    var getFieldIndex = function (columns, field) {
        var index = -1;

        $.each(columns, function (i, column) {
            if (column.field === field) {
                index = i;
                return false;
            }
            return true;
        });
        return index;
    };

    // http://jsfiddle.net/wenyi/47nz7ez9/3/
    var setFieldIndex = function (columns) {
        var i, j, k,
            totalCol = 0,
            flag = [];

        for (i = 0; i < columns[0].length; i++) {
            totalCol += columns[0][i].colspan || 1;
        }

        for (i = 0; i < columns.length; i++) {
            flag[i] = [];
            for (j = 0; j < totalCol; j++) {
                flag[i][j] = false;
            }
        }

        for (i = 0; i < columns.length; i++) {
            for (j = 0; j < columns[i].length; j++) {
                var r = columns[i][j],
                    rowspan = r.rowspan || 1,
                    colspan = r.colspan || 1,
                    index = $.inArray(false, flag[i]);

                if (colspan === 1) {
                    r.fieldIndex = index;
                    // when field is undefined, use index instead
                    if (typeof r.field === 'undefined') {
                        r.field = index;
                    }
                }

                for (k = 0; k < rowspan; k++) {
                    flag[i + k][index] = true;
                }
                for (k = 0; k < colspan; k++) {
                    flag[i][index + k] = true;
                }
            }
        }
    };

    var getScrollBarWidth = function () {
        if (cachedWidth === null) {
            var inner = $('<p/>').addClass('fixed-table-scroll-inner'),
                outer = $('<div/>').addClass('fixed-table-scroll-outer'),
                w1, w2;

            outer.append(inner);
            $('body').append(outer);

            w1 = inner[0].offsetWidth;
            outer.css('overflow', 'scroll');
            w2 = inner[0].offsetWidth;

            if (w1 === w2) {
                w2 = outer[0].clientWidth;
            }

            outer.remove();
            cachedWidth = w1 - w2;
        }
        return cachedWidth;
    };

    var calculateObjectValue = function (self, name, args, defaultValue) {
        var func = name;

        if (typeof name === 'string') {
            // support obj.func1.func2
            var names = name.split('.');

            if (names.length > 1) {
                func = window;
                $.each(names, function (i, f) {
                    func = func[f];
                });
            } else {
                func = window[name];
            }
        }
        if (typeof func === 'object') {
            return func;
        }
        if (typeof func === 'function') {
            return func.apply(self, args);
        }
        if (!func && typeof name === 'string' && sprintf.apply(this, [name].concat(args))) {
            return sprintf.apply(this, [name].concat(args));
        }
        return defaultValue;
    };

    var compareObjects = function (objectA, objectB, compareLength) {
        // Create arrays of property names
        var objectAProperties = Object.getOwnPropertyNames(objectA),
            objectBProperties = Object.getOwnPropertyNames(objectB),
            propName = '';

        if (compareLength) {
            // If number of properties is different, objects are not equivalent
            if (objectAProperties.length !== objectBProperties.length) {
                return false;
            }
        }

        for (var i = 0; i < objectAProperties.length; i++) {
            propName = objectAProperties[i];

            // If the property is not in the object B properties, continue with the next property
            if ($.inArray(propName, objectBProperties) > -1) {
                // If values of same property are not equal, objects are not equivalent
                if (objectA[propName] !== objectB[propName]) {
                    return false;
                }
            }
        }

        // If we made it this far, objects are considered equivalent
        return true;
    };

    var escapeHTML = function (text) {
        if (typeof text === 'string') {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .replace(/`/g, '&#x60;');
        }
        return text;
    };

    var getRealHeight = function ($el) {
        var height = 0;
        $el.children().each(function () {
            if (height < $(this).outerHeight(true)) {
                height = $(this).outerHeight(true);
            }
        });
        return height;
    };

    var getRealDataAttr = function (dataAttr) {
        for (var attr in dataAttr) {
            var auxAttr = attr.split(/(?=[A-Z])/).join('-').toLowerCase();
            if (auxAttr !== attr) {
                dataAttr[auxAttr] = dataAttr[attr];
                delete dataAttr[attr];
            }
        }

        return dataAttr;
    };

    var getItemField = function (item, field, escape) {
        var value = item;

        if (typeof field !== 'string' || item.hasOwnProperty(field)) {
            return escape ? escapeHTML(item[field]) : item[field];
        }
        var props = field.split('.');
        for (var p in props) {
            value = value && value[props[p]];
        }
        return escape ? escapeHTML(value) : value;
    };

    var isIEBrowser = function () {
        return !!(navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./));
    };

    // BOOTSTRAP TABLE CLASS DEFINITION
    // ======================

    var BootstrapTable = function (el, options) {
        this.options = options;
        this.$el = $(el);
        this.$el_ = this.$el.clone();
        this.timeoutId_ = 0;
        this.timeoutFooter_ = 0;

        this.init();
    };

    BootstrapTable.DEFAULTS = {
        classes: 'table table-hover',
        locale: undefined,
        height: undefined,
        undefinedText: '-',
        sortName: undefined,
        sortOrder: 'asc',
        striped: false,
        columns: [[]],
        data: [],
        dataField: 'rows',
        method: 'get',
        url: undefined,
        ajax: undefined,
        cache: true,
        contentType: 'application/json',
        dataType: 'json',
        ajaxOptions: {},
        queryParams: function (params) {
            return params;
        },
        queryParamsType: 'limit', // undefined
        responseHandler: function (res) {
            return res;
        },
        pagination: false,
        onlyInfoPagination: false,
        sidePagination: 'client', // client or server
        totalRows: 0, // server side need to set
        pageNumber: 1,
        pageSize: 10,
        pageList: [10, 25, 50, 100],
        paginationHAlign: 'right', //right, left
        paginationVAlign: 'bottom', //bottom, top, both
        paginationDetailHAlign: 'left', //right, left
        paginationPreText: '&lsaquo;',
        paginationNextText: '&rsaquo;',
        search: false,
        searchOnEnterKey: false,
        strictSearch: false,
        searchAlign: 'right',
        selectItemName: 'btSelectItem',
        showHeader: true,
        showFooter: false,
        showColumns: false,
        showPaginationSwitch: false,
        showRefresh: false,
        showToggle: false,
        buttonsAlign: 'right',
        smartDisplay: true,
        escape: false,
        minimumCountColumns: 1,
        idField: undefined,
        uniqueId: undefined,
        cardView: false,
        detailView: false,
        detailFormatter: function (index, row) {
            return '';
        },
        trimOnSearch: true,
        clickToSelect: false,
        singleSelect: false,
        toolbar: undefined,
        toolbarAlign: 'left',
        checkboxHeader: true,
        sortable: true,
        silentSort: true,
        maintainSelected: false,
        searchTimeOut: 500,
        searchText: '',
        iconSize: undefined,
        iconsPrefix: 'glyphicon', // glyphicon of fa (font awesome)
        icons: {
            paginationSwitchDown: 'glyphicon-collapse-down icon-chevron-down',
            paginationSwitchUp: 'glyphicon-collapse-up icon-chevron-up',
            refresh: 'glyphicon-refresh icon-refresh',
            toggle: 'glyphicon-list-alt icon-list-alt',
            columns: 'glyphicon-th icon-th',
            detailOpen: 'glyphicon-plus icon-plus',
            detailClose: 'glyphicon-minus icon-minus'
        },

        rowStyle: function (row, index) {
            return {};
        },

        rowAttributes: function (row, index) {
            return {};
        },

        onAll: function (name, args) {
            return false;
        },
        onClickCell: function (field, value, row, $element) {
            return false;
        },
        onDblClickCell: function (field, value, row, $element) {
            return false;
        },
        onClickRow: function (item, $element) {
            return false;
        },
        onDblClickRow: function (item, $element) {
            return false;
        },
        onSort: function (name, order) {
            return false;
        },
        onCheck: function (row) {
            return false;
        },
        onUncheck: function (row) {
            return false;
        },
        onCheckAll: function (rows) {
            return false;
        },
        onUncheckAll: function (rows) {
            return false;
        },
        onCheckSome: function (rows) {
            return false;
        },
        onUncheckSome: function (rows) {
            return false;
        },
        onLoadSuccess: function (data) {
            return false;
        },
        onLoadError: function (status) {
            return false;
        },
        onColumnSwitch: function (field, checked) {
            return false;
        },
        onPageChange: function (number, size) {
            return false;
        },
        onSearch: function (text) {
            return false;
        },
        onToggle: function (cardView) {
            return false;
        },
        onPreBody: function (data) {
            return false;
        },
        onPostBody: function () {
            return false;
        },
        onPostHeader: function () {
            return false;
        },
        onExpandRow: function (index, row, $detail) {
            return false;
        },
        onCollapseRow: function (index, row) {
            return false;
        },
        onRefreshOptions: function (options) {
            return false;
        },
        onResetView: function () {
            return false;
        }
    };

    BootstrapTable.LOCALES = [];

    BootstrapTable.LOCALES['en-US'] = BootstrapTable.LOCALES['en'] = {
        formatLoadingMessage: function () {
            return 'Loading, please wait...';
        },
        formatRecordsPerPage: function (pageNumber) {
            return sprintf('%s records per page', pageNumber);
        },
        formatShowingRows: function (pageFrom, pageTo, totalRows) {
            return sprintf('Showing %s to %s of %s rows', pageFrom, pageTo, totalRows);
        },
        formatDetailPagination: function (totalRows) {
            return sprintf('Showing %s rows', totalRows);
        },
        formatSearch: function () {
            return 'Search';
        },
        formatNoMatches: function () {
            return 'No matching records found';
        },
        formatPaginationSwitch: function () {
            return 'Hide/Show pagination';
        },
        formatRefresh: function () {
            return 'Refresh';
        },
        formatToggle: function () {
            return 'Toggle';
        },
        formatColumns: function () {
            return 'Columns';
        },
        formatAllRows: function () {
            return 'All';
        }
    };

    $.extend(BootstrapTable.DEFAULTS, BootstrapTable.LOCALES['en-US']);

    BootstrapTable.COLUMN_DEFAULTS = {
        radio: false,
        checkbox: false,
        checkboxEnabled: true,
        field: undefined,
        title: undefined,
        titleTooltip: undefined,
        'class': undefined,
        align: undefined, // left, right, center
        halign: undefined, // left, right, center
        falign: undefined, // left, right, center
        valign: undefined, // top, middle, bottom
        width: undefined,
        sortable: false,
        order: 'asc', // asc, desc
        visible: true,
        switchable: true,
        clickToSelect: true,
        formatter: undefined,
        footerFormatter: undefined,
        events: undefined,
        sorter: undefined,
        sortName: undefined,
        cellStyle: undefined,
        searchable: true,
        searchFormatter: true,
        cardVisible: true
    };

    BootstrapTable.EVENTS = {
        'all.bs.table': 'onAll',
        'click-cell.bs.table': 'onClickCell',
        'dbl-click-cell.bs.table': 'onDblClickCell',
        'click-row.bs.table': 'onClickRow',
        'dbl-click-row.bs.table': 'onDblClickRow',
        'sort.bs.table': 'onSort',
        'check.bs.table': 'onCheck',
        'uncheck.bs.table': 'onUncheck',
        'check-all.bs.table': 'onCheckAll',
        'uncheck-all.bs.table': 'onUncheckAll',
        'check-some.bs.table': 'onCheckSome',
        'uncheck-some.bs.table': 'onUncheckSome',
        'load-success.bs.table': 'onLoadSuccess',
        'load-error.bs.table': 'onLoadError',
        'column-switch.bs.table': 'onColumnSwitch',
        'page-change.bs.table': 'onPageChange',
        'search.bs.table': 'onSearch',
        'toggle.bs.table': 'onToggle',
        'pre-body.bs.table': 'onPreBody',
        'post-body.bs.table': 'onPostBody',
        'post-header.bs.table': 'onPostHeader',
        'expand-row.bs.table': 'onExpandRow',
        'collapse-row.bs.table': 'onCollapseRow',
        'refresh-options.bs.table': 'onRefreshOptions',
        'reset-view.bs.table': 'onResetView'
    };

    BootstrapTable.prototype.init = function () {
        this.initLocale();
        this.initContainer();
        this.initTable();
        this.initHeader();
        this.initData();
        this.initFooter();
        this.initToolbar();
        this.initPagination();
        this.initBody();
        this.initSearchText();
        this.initServer();
    };

    BootstrapTable.prototype.initLocale = function () {
        if (this.options.locale) {
            var parts = this.options.locale.split(/-|_/);
            parts[0].toLowerCase();
            parts[1] && parts[1].toUpperCase();
            if ($.fn.bootstrapTable.locales[this.options.locale]) {
                // locale as requested
                $.extend(this.options, $.fn.bootstrapTable.locales[this.options.locale]);
            } else if ($.fn.bootstrapTable.locales[parts.join('-')]) {
                // locale with sep set to - (in case original was specified with _)
                $.extend(this.options, $.fn.bootstrapTable.locales[parts.join('-')]);
            } else if ($.fn.bootstrapTable.locales[parts[0]]) {
                // short locale language code (i.e. 'en')
                $.extend(this.options, $.fn.bootstrapTable.locales[parts[0]]);
            }
        }
    };

    BootstrapTable.prototype.initContainer = function () {
        this.$container = $([
            '<div class="bootstrap-table">',
            '<div class="fixed-table-toolbar"></div>',
            this.options.paginationVAlign === 'top' || this.options.paginationVAlign === 'both' ?
                '<div class="fixed-table-pagination" style="clear: both;"></div>' :
                '',
            '<div class="fixed-table-container">',
            '<div class="fixed-table-header"><table></table></div>',
            '<div class="fixed-table-body">',
            '<div class="fixed-table-loading">',
            this.options.formatLoadingMessage(),
            '</div>',
            '</div>',
            '<div class="fixed-table-footer"><table><tr></tr></table></div>',
            this.options.paginationVAlign === 'bottom' || this.options.paginationVAlign === 'both' ?
                '<div class="fixed-table-pagination"></div>' :
                '',
            '</div>',
            '</div>'
        ].join(''));

        this.$container.insertAfter(this.$el);
        this.$tableContainer = this.$container.find('.fixed-table-container');
        this.$tableHeader = this.$container.find('.fixed-table-header');
        this.$tableBody = this.$container.find('.fixed-table-body');
        this.$tableLoading = this.$container.find('.fixed-table-loading');
        this.$tableFooter = this.$container.find('.fixed-table-footer');
        this.$toolbar = this.$container.find('.fixed-table-toolbar');
        this.$pagination = this.$container.find('.fixed-table-pagination');

        this.$tableBody.append(this.$el);
        this.$container.after('<div class="clearfix"></div>');

        this.$el.addClass(this.options.classes);
        if (this.options.striped) {
            this.$el.addClass('table-striped');
        }
        if ($.inArray('table-no-bordered', this.options.classes.split(' ')) !== -1) {
            this.$tableContainer.addClass('table-no-bordered');
        }
    };

    BootstrapTable.prototype.initTable = function () {
        var that = this,
            columns = [],
            data = [];

        this.$header = this.$el.find('>thead');
        if (!this.$header.length) {
            this.$header = $('<thead></thead>').appendTo(this.$el);
        }
        this.$header.find('tr').each(function () {
            var column = [];

            $(this).find('th').each(function () {
                column.push($.extend({}, {
                    title: $(this).html(),
                    'class': $(this).attr('class'),
                    titleTooltip: $(this).attr('title'),
                    rowspan: $(this).attr('rowspan') ? +$(this).attr('rowspan') : undefined,
                    colspan: $(this).attr('colspan') ? +$(this).attr('colspan') : undefined
                }, $(this).data()));
            });
            columns.push(column);
        });
        if (!$.isArray(this.options.columns[0])) {
            this.options.columns = [this.options.columns];
        }
        this.options.columns = $.extend(true, [], columns, this.options.columns);
        this.columns = [];

        setFieldIndex(this.options.columns);
        $.each(this.options.columns, function (i, columns) {
            $.each(columns, function (j, column) {
                column = $.extend({}, BootstrapTable.COLUMN_DEFAULTS, column);

                if (typeof column.fieldIndex !== 'undefined') {
                    that.columns[column.fieldIndex] = column;
                }

                that.options.columns[i][j] = column;
            });
        });

        // if options.data is setting, do not process tbody data
        if (this.options.data.length) {
            return;
        }

        this.$el.find('>tbody>tr').each(function () {
            var row = {};

            // save tr's id, class and data-* attributes
            row._id = $(this).attr('id');
            row._class = $(this).attr('class');
            row._data = getRealDataAttr($(this).data());

            $(this).find('td').each(function (i) {
                var field = that.columns[i].field;

                row[field] = $(this).html();
                // save td's id, class and data-* attributes
                row['_' + field + '_id'] = $(this).attr('id');
                row['_' + field + '_class'] = $(this).attr('class');
                row['_' + field + '_rowspan'] = $(this).attr('rowspan');
                row['_' + field + '_title'] = $(this).attr('title');
                row['_' + field + '_data'] = getRealDataAttr($(this).data());
            });
            data.push(row);
        });
        this.options.data = data;
    };

    BootstrapTable.prototype.initHeader = function () {
        var that = this,
            visibleColumns = {},
            html = [];

        this.header = {
            fields: [],
            styles: [],
            classes: [],
            formatters: [],
            events: [],
            sorters: [],
            sortNames: [],
            cellStyles: [],
            searchables: []
        };

        $.each(this.options.columns, function (i, columns) {
            html.push('<tr>');

            if (i == 0 && !that.options.cardView && that.options.detailView) {
                html.push(sprintf('<th class="detail" rowspan="%s"><div class="fht-cell"></div></th>',
                    that.options.columns.length));
            }

            $.each(columns, function (j, column) {
                var text = '',
                    halign = '', // header align style
                    align = '', // body align style
                    style = '',
                    class_ = sprintf(' class="%s"', column['class']),
                    order = that.options.sortOrder || column.order,
                    unitWidth = 'px',
                    width = column.width;

                if (column.width !== undefined && (!that.options.cardView)) {
                    if (typeof column.width === 'string') {
                        if (column.width.indexOf('%') !== -1) {
                            unitWidth = '%';
                        }
                    }
                }
                if (column.width && typeof column.width === 'string') {
                    width = column.width.replace('%', '').replace('px', '');
                }

                halign = sprintf('text-align: %s; ', column.halign ? column.halign : column.align);
                align = sprintf('text-align: %s; ', column.align);
                style = sprintf('vertical-align: %s; ', column.valign);
                style += sprintf('width: %s; ', (column.checkbox || column.radio) && !width ?
                    '36px' : (width ? width + unitWidth : undefined));

                if (typeof column.fieldIndex !== 'undefined') {
                    that.header.fields[column.fieldIndex] = column.field;
                    that.header.styles[column.fieldIndex] = align + style;
                    that.header.classes[column.fieldIndex] = class_;
                    that.header.formatters[column.fieldIndex] = column.formatter;
                    that.header.events[column.fieldIndex] = column.events;
                    that.header.sorters[column.fieldIndex] = column.sorter;
                    that.header.sortNames[column.fieldIndex] = column.sortName;
                    that.header.cellStyles[column.fieldIndex] = column.cellStyle;
                    that.header.searchables[column.fieldIndex] = column.searchable;

                    if (!column.visible) {
                        return;
                    }

                    if (that.options.cardView && (!column.cardVisible)) {
                        return;
                    }

                    visibleColumns[column.field] = column;
                }

                html.push('<th' + sprintf(' title="%s"', column.titleTooltip),
                    column.checkbox || column.radio ?
                        sprintf(' class="bs-checkbox %s"', column['class'] || '') :
                        class_,
                    sprintf(' style="%s"', halign + style),
                    sprintf(' rowspan="%s"', column.rowspan),
                    sprintf(' colspan="%s"', column.colspan),
                    sprintf(' data-field="%s"', column.field),
                    "tabindex='0'",
                    '>');

                html.push(sprintf('<div class="th-inner %s">', that.options.sortable && column.sortable ?
                    'sortable both' : ''));

                text = column.title;

                if (column.checkbox) {
                    if (!that.options.singleSelect && that.options.checkboxHeader) {
                        text = '<input name="btSelectAll" type="checkbox" />';
                    }
                    that.header.stateField = column.field;
                }
                if (column.radio) {
                    text = '';
                    that.header.stateField = column.field;
                    that.options.singleSelect = true;
                }

                html.push(text);
                html.push('</div>');
                html.push('<div class="fht-cell"></div>');
                html.push('</div>');
                html.push('</th>');
            });
            html.push('</tr>');
        });

        this.$header.html(html.join(''));
        this.$header.find('th[data-field]').each(function (i) {
            $(this).data(visibleColumns[$(this).data('field')]);
        });
        this.$container.off('click', '.th-inner').on('click', '.th-inner', function (event) {
            var target = $(this);
            if (target.closest('.bootstrap-table')[0] !== that.$container[0])
                return false;

            if (that.options.sortable && target.parent().data().sortable) {
                that.onSort(event);
            }
        });

        this.$header.children().children().off('keypress').on('keypress', function (event) {
            if (that.options.sortable && $(this).data().sortable) {
                var code = event.keyCode || event.which;
                if (code == 13) { //Enter keycode
                    that.onSort(event);
                }
            }
        });

        if (!this.options.showHeader || this.options.cardView) {
            this.$header.hide();
            this.$tableHeader.hide();
            this.$tableLoading.css('top', 0);
        } else {
            this.$header.show();
            this.$tableHeader.show();
            this.$tableLoading.css('top', this.$header.outerHeight() + 1);
            // Assign the correct sortable arrow
            this.getCaret();
        }

        this.$selectAll = this.$header.find('[name="btSelectAll"]');
        this.$selectAll.off('click').on('click', function () {
                var checked = $(this).prop('checked');
                that[checked ? 'checkAll' : 'uncheckAll']();
                that.updateSelected();
            });
    };

    BootstrapTable.prototype.initFooter = function () {
        if (!this.options.showFooter || this.options.cardView) {
            this.$tableFooter.hide();
        } else {
            this.$tableFooter.show();
        }
    };

    /**
     * @param data
     * @param type: append / prepend
     */
    BootstrapTable.prototype.initData = function (data, type) {
        if (type === 'append') {
            this.data = this.data.concat(data);
        } else if (type === 'prepend') {
            this.data = [].concat(data).concat(this.data);
        } else {
            this.data = data || this.options.data;
        }

        // Fix #839 Records deleted when adding new row on filtered table
        if (type === 'append') {
            this.options.data = this.options.data.concat(data);
        } else if (type === 'prepend') {
            this.options.data = [].concat(data).concat(this.options.data);
        } else {
            this.options.data = this.data;
        }

        if (this.options.sidePagination === 'server') {
            return;
        }
        this.initSort();
    };

    BootstrapTable.prototype.initSort = function () {
        var that = this,
            name = this.options.sortName,
            order = this.options.sortOrder === 'desc' ? -1 : 1,
            index = $.inArray(this.options.sortName, this.header.fields);

        if (index !== -1) {
            this.data.sort(function (a, b) {
                if (that.header.sortNames[index]) {
                    name = that.header.sortNames[index];
                }
                var aa = getItemField(a, name, that.options.escape),
                    bb = getItemField(b, name, that.options.escape),
                    value = calculateObjectValue(that.header, that.header.sorters[index], [aa, bb]);

                if (value !== undefined) {
                    return order * value;
                }

                // Fix #161: undefined or null string sort bug.
                if (aa === undefined || aa === null) {
                    aa = '';
                }
                if (bb === undefined || bb === null) {
                    bb = '';
                }

                // IF both values are numeric, do a numeric comparison
                if ($.isNumeric(aa) && $.isNumeric(bb)) {
                    // Convert numerical values form string to float.
                    aa = parseFloat(aa);
                    bb = parseFloat(bb);
                    if (aa < bb) {
                        return order * -1;
                    }
                    return order;
                }

                if (aa === bb) {
                    return 0;
                }

                // If value is not a string, convert to string
                if (typeof aa !== 'string') {
                    aa = aa.toString();
                }

                if (aa.localeCompare(bb) === -1) {
                    return order * -1;
                }

                return order;
            });
        }
    };

    BootstrapTable.prototype.onSort = function (event) {
        var $this = event.type === "keypress" ? $(event.currentTarget) : $(event.currentTarget).parent(),
            $this_ = this.$header.find('th').eq($this.index());

        this.$header.add(this.$header_).find('span.order').remove();

        if (this.options.sortName === $this.data('field')) {
            this.options.sortOrder = this.options.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.options.sortName = $this.data('field');
            this.options.sortOrder = $this.data('order') === 'asc' ? 'desc' : 'asc';
        }
        this.trigger('sort', this.options.sortName, this.options.sortOrder);

        $this.add($this_).data('order', this.options.sortOrder);

        // Assign the correct sortable arrow
        this.getCaret();

        if (this.options.sidePagination === 'server') {
            this.initServer(this.options.silentSort);
            return;
        }

        this.initSort();
        this.initBody();
    };

    BootstrapTable.prototype.initToolbar = function () {
        var that = this,
            html = [],
            timeoutId = 0,
            $keepOpen,
            $search,
            switchableCount = 0;

        if (this.$toolbar.find('.bars').children().length) {
            $('body').append($(this.options.toolbar));
        }
        this.$toolbar.html('');

        if (typeof this.options.toolbar === 'string' || typeof this.options.toolbar === 'object') {
            $(sprintf('<div class="bars pull-%s"></div>', this.options.toolbarAlign))
                .appendTo(this.$toolbar)
                .append($(this.options.toolbar));
        }

        // showColumns, showToggle, showRefresh
        html = [sprintf('<div class="columns columns-%s btn-group pull-%s">',
            this.options.buttonsAlign, this.options.buttonsAlign)];

        if (typeof this.options.icons === 'string') {
            this.options.icons = calculateObjectValue(null, this.options.icons);
        }

        if (this.options.showPaginationSwitch) {
            html.push(sprintf('<button class="btn btn-default" type="button" name="paginationSwitch" title="%s">',
                    this.options.formatPaginationSwitch()),
                sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.paginationSwitchDown),
                '</button>');
        }

        if (this.options.showRefresh) {
            html.push(sprintf('<button class="btn btn-default' +
                    sprintf(' btn-%s', this.options.iconSize) +
                    '" type="button" name="refresh" title="%s">',
                    this.options.formatRefresh()),
                sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.refresh),
                '</button>');
        }

        if (this.options.showToggle) {
            html.push(sprintf('<button class="btn btn-default' +
                    sprintf(' btn-%s', this.options.iconSize) +
                    '" type="button" name="toggle" title="%s">',
                    this.options.formatToggle()),
                sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.toggle),
                '</button>');
        }

        if (this.options.showColumns) {
            html.push(sprintf('<div class="keep-open btn-group" title="%s">',
                    this.options.formatColumns()),
                '<button type="button" class="btn btn-default' +
                sprintf(' btn-%s', this.options.iconSize) +
                ' dropdown-toggle" data-toggle="dropdown">',
                sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.columns),
                ' <span class="caret"></span>',
                '</button>',
                '<ul class="dropdown-menu" role="menu">');

            $.each(this.columns, function (i, column) {
                if (column.radio || column.checkbox) {
                    return;
                }

                if (that.options.cardView && (!column.cardVisible)) {
                    return;
                }

                var checked = column.visible ? ' checked="checked"' : '';

                if (column.switchable) {
                    html.push(sprintf('<li>' +
                        '<label><input type="checkbox" data-field="%s" value="%s"%s> %s</label>' +
                        '</li>', column.field, i, checked, column.title));
                    switchableCount++;
                }
            });
            html.push('</ul>',
                '</div>');
        }

        html.push('</div>');

        // Fix #188: this.showToolbar is for extensions
        if (this.showToolbar || html.length > 2) {
            this.$toolbar.append(html.join(''));
        }

        if (this.options.showPaginationSwitch) {
            this.$toolbar.find('button[name="paginationSwitch"]')
                .off('click').on('click', $.proxy(this.togglePagination, this));
        }

        if (this.options.showRefresh) {
            this.$toolbar.find('button[name="refresh"]')
                .off('click').on('click', $.proxy(this.refresh, this));
        }

        if (this.options.showToggle) {
            this.$toolbar.find('button[name="toggle"]')
                .off('click').on('click', function () {
                    that.toggleView();
                });
        }

        if (this.options.showColumns) {
            $keepOpen = this.$toolbar.find('.keep-open');

            if (switchableCount <= this.options.minimumCountColumns) {
                $keepOpen.find('input').prop('disabled', true);
            }

            $keepOpen.find('li').off('click').on('click', function (event) {
                event.stopImmediatePropagation();
            });
            $keepOpen.find('input').off('click').on('click', function () {
                var $this = $(this);

                that.toggleColumn(getFieldIndex(that.columns,
                    $(this).data('field')), $this.prop('checked'), false);
                that.trigger('column-switch', $(this).data('field'), $this.prop('checked'));
            });
        }

        if (this.options.search) {
            html = [];
            html.push(
                '<div class="pull-' + this.options.searchAlign + ' search">',
                sprintf('<input class="form-control' +
                    sprintf(' input-%s', this.options.iconSize) +
                    '" type="text" placeholder="%s">',
                    this.options.formatSearch()),
                '</div>');

            this.$toolbar.append(html.join(''));
            $search = this.$toolbar.find('.search input');
            $search.off('keyup drop').on('keyup drop', function (event) {
                if (that.options.searchOnEnterKey) {
                    if (event.keyCode !== 13) {
                        return;
                    }
                }

                clearTimeout(timeoutId); // doesn't matter if it's 0
                timeoutId = setTimeout(function () {
                    that.onSearch(event);
                }, that.options.searchTimeOut);
            });

            if (isIEBrowser()) {
                $search.off('mouseup').on('mouseup', function (event) {
                    clearTimeout(timeoutId); // doesn't matter if it's 0
                    timeoutId = setTimeout(function () {
                        that.onSearch(event);
                    }, that.options.searchTimeOut);
                });
            }
        }
    };

    BootstrapTable.prototype.onSearch = function (event) {
        var text = $.trim($(event.currentTarget).val());

        // trim search input
        if (this.options.trimOnSearch && $(event.currentTarget).val() !== text) {
            $(event.currentTarget).val(text);
        }

        if (text === this.searchText) {
            return;
        }
        this.searchText = text;
        this.options.searchText = text;

        this.options.pageNumber = 1;
        this.initSearch();
        this.updatePagination();
        this.trigger('search', text);
    };

    BootstrapTable.prototype.initSearch = function () {
        var that = this;

        if (this.options.sidePagination !== 'server') {
            var s = this.searchText && this.searchText.toLowerCase();
            var f = $.isEmptyObject(this.filterColumns) ? null : this.filterColumns;

            // Check filter
            this.data = f ? $.grep(this.options.data, function (item, i) {
                for (var key in f) {
                    if ($.isArray(f[key])) {
                        if ($.inArray(item[key], f[key]) === -1) {
                            return false;
                        }
                    } else if (item[key] !== f[key]) {
                        return false;
                    }
                }
                return true;
            }) : this.options.data;

            this.data = s ? $.grep(this.data, function (item, i) {
                for (var key in item) {
                    key = $.isNumeric(key) ? parseInt(key, 10) : key;
                    var value = item[key],
                        column = that.columns[getFieldIndex(that.columns, key)],
                        j = $.inArray(key, that.header.fields);

                    // Fix #142: search use formatted data
                    if (column && column.searchFormatter) {
                        value = calculateObjectValue(column,
                            that.header.formatters[j], [value, item, i], value);
                    }

                    var index = $.inArray(key, that.header.fields);
                    if (index !== -1 && that.header.searchables[index] && (typeof value === 'string' || typeof value === 'number')) {
                        if (that.options.strictSearch) {
                            if ((value + '').toLowerCase() === s) {
                                return true;
                            }
                        } else {
                            if ((value + '').toLowerCase().indexOf(s) !== -1) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            }) : this.data;
        }
    };

    BootstrapTable.prototype.initPagination = function () {
        if (!this.options.pagination) {
            this.$pagination.hide();
            return;
        } else {
            this.$pagination.show();
        }

        var that = this,
            html = [],
            $allSelected = false,
            i, from, to,
            $pageList,
            $first, $pre,
            $next, $last,
            $number,
            data = this.getData();

        if (this.options.sidePagination !== 'server') {
            this.options.totalRows = data.length;
        }

        this.totalPages = 0;
        if (this.options.totalRows) {
            if (this.options.pageSize === this.options.formatAllRows()) {
                this.options.pageSize = this.options.totalRows;
                $allSelected = true;
            } else if (this.options.pageSize === this.options.totalRows) {
                // Fix #667 Table with pagination,
                // multiple pages and a search that matches to one page throws exception
                var pageLst = typeof this.options.pageList === 'string' ?
                    this.options.pageList.replace('[', '').replace(']', '')
                        .replace(/ /g, '').toLowerCase().split(',') : this.options.pageList;
                if ($.inArray(this.options.formatAllRows().toLowerCase(), pageLst)  > -1) {
                    $allSelected = true;
                }
            }

            this.totalPages = ~~((this.options.totalRows - 1) / this.options.pageSize) + 1;

            this.options.totalPages = this.totalPages;
        }
        if (this.totalPages > 0 && this.options.pageNumber > this.totalPages) {
            this.options.pageNumber = this.totalPages;
        }

        this.pageFrom = (this.options.pageNumber - 1) * this.options.pageSize + 1;
        this.pageTo = this.options.pageNumber * this.options.pageSize;
        if (this.pageTo > this.options.totalRows) {
            this.pageTo = this.options.totalRows;
        }

        html.push(
            '<div class="pull-' + this.options.paginationDetailHAlign + ' pagination-detail">',
            '<span class="pagination-info">',
            this.options.onlyInfoPagination ? this.options.formatDetailPagination(this.options.totalRows) :
            this.options.formatShowingRows(this.pageFrom, this.pageTo, this.options.totalRows),
            '</span>');

        if (!this.options.onlyInfoPagination) {
            html.push('<span class="page-list">');

            var pageNumber = [
                    sprintf('<span class="btn-group %s">',
                        this.options.paginationVAlign === 'top' || this.options.paginationVAlign === 'both' ?
                            'dropdown' : 'dropup'),
                    '<button type="button" class="btn btn-default ' +
                    sprintf(' btn-%s', this.options.iconSize) +
                    ' dropdown-toggle" data-toggle="dropdown">',
                    '<span class="page-size">',
                    $allSelected ? this.options.formatAllRows() : this.options.pageSize,
                    '</span>',
                    ' <span class="caret"></span>',
                    '</button>',
                    '<ul class="dropdown-menu" role="menu">'
                ],
                pageList = this.options.pageList;

            if (typeof this.options.pageList === 'string') {
                var list = this.options.pageList.replace('[', '').replace(']', '')
                    .replace(/ /g, '').split(',');

                pageList = [];
                $.each(list, function (i, value) {
                    pageList.push(value.toUpperCase() === that.options.formatAllRows().toUpperCase() ?
                        that.options.formatAllRows() : +value);
                });
            }

            $.each(pageList, function (i, page) {
                if (!that.options.smartDisplay || i === 0 || pageList[i - 1] <= that.options.totalRows) {
                    var active;
                    if ($allSelected) {
                        active = page === that.options.formatAllRows() ? ' class="active"' : '';
                    } else {
                        active = page === that.options.pageSize ? ' class="active"' : '';
                    }
                    pageNumber.push(sprintf('<li%s><a href="javascript:void(0)">%s</a></li>', active, page));
                }
            });
            pageNumber.push('</ul></span>');

            html.push(this.options.formatRecordsPerPage(pageNumber.join('')));
            html.push('</span>');

            html.push('</div>',
                '<div class="pull-' + this.options.paginationHAlign + ' pagination">',
                '<ul class="pagination' + sprintf(' pagination-%s', this.options.iconSize) + '">',
                '<li class="page-pre"><a href="javascript:void(0)">' + this.options.paginationPreText + '</a></li>');

            if (this.totalPages < 5) {
                from = 1;
                to = this.totalPages;
            } else {
                from = this.options.pageNumber - 2;
                to = from + 4;
                if (from < 1) {
                    from = 1;
                    to = 5;
                }
                if (to > this.totalPages) {
                    to = this.totalPages;
                    from = to - 4;
                }
            }

            if (this.totalPages >= 6) {
                if (this.options.pageNumber >= 3) {
                    html.push('<li class="page-first' + (1 === this.options.pageNumber ? ' active' : '') + '">',
                        '<a href="javascript:void(0)">', 1, '</a>',
                        '</li>');

                    from++;
                }

                if (this.options.pageNumber >= 4) {
                    if (this.options.pageNumber == 4 || this.totalPages == 6 || this.totalPages == 7) {
                        from--;
                    } else {
                        html.push('<li class="page-first-separator disabled">',
                            '<a href="javascript:void(0)">...</a>',
                            '</li>');
                    }

                    to--;
                }
            }

            if (this.totalPages >= 7) {
                if (this.options.pageNumber >= (this.totalPages - 2)) {
                    from--;
                }
            }

            if (this.totalPages == 6) {
                if (this.options.pageNumber >= (this.totalPages - 2)) {
                    to++;
                }
            } else if (this.totalPages >= 7) {
                if (this.totalPages == 7 || this.options.pageNumber >= (this.totalPages - 3)) {
                    to++;
                }
            }

            for (i = from; i <= to; i++) {
                html.push('<li class="page-number' + (i === this.options.pageNumber ? ' active' : '') + '">',
                    '<a href="javascript:void(0)">', i, '</a>',
                    '</li>');
            }

            if (this.totalPages >= 8) {
                if (this.options.pageNumber <= (this.totalPages - 4)) {
                    html.push('<li class="page-last-separator disabled">',
                        '<a href="javascript:void(0)">...</a>',
                        '</li>');
                }
            }

            if (this.totalPages >= 6) {
                if (this.options.pageNumber <= (this.totalPages - 3)) {
                    html.push('<li class="page-last' + (this.totalPages === this.options.pageNumber ? ' active' : '') + '">',
                        '<a href="javascript:void(0)">', this.totalPages, '</a>',
                        '</li>');
                }
            }

            html.push(
                '<li class="page-next"><a href="javascript:void(0)">' + this.options.paginationNextText + '</a></li>',
                '</ul>',
                '</div>');
        }
        this.$pagination.html(html.join(''));

        if (!this.options.onlyInfoPagination) {
            $pageList = this.$pagination.find('.page-list a');
            $first = this.$pagination.find('.page-first');
            $pre = this.$pagination.find('.page-pre');
            $next = this.$pagination.find('.page-next');
            $last = this.$pagination.find('.page-last');
            $number = this.$pagination.find('.page-number');

            if (this.options.smartDisplay) {
                if (this.totalPages <= 1) {
                    this.$pagination.find('div.pagination').hide();
                }
                if (pageList.length < 2 || this.options.totalRows <= pageList[0]) {
                    this.$pagination.find('span.page-list').hide();
                }

                // when data is empty, hide the pagination
                this.$pagination[this.getData().length ? 'show' : 'hide']();
            }
            if ($allSelected) {
                this.options.pageSize = this.options.formatAllRows();
            }
            $pageList.off('click').on('click', $.proxy(this.onPageListChange, this));
            $first.off('click').on('click', $.proxy(this.onPageFirst, this));
            $pre.off('click').on('click', $.proxy(this.onPagePre, this));
            $next.off('click').on('click', $.proxy(this.onPageNext, this));
            $last.off('click').on('click', $.proxy(this.onPageLast, this));
            $number.off('click').on('click', $.proxy(this.onPageNumber, this));
        }
    };

    BootstrapTable.prototype.updatePagination = function (event) {
        // Fix #171: IE disabled button can be clicked bug.
        if (event && $(event.currentTarget).hasClass('disabled')) {
            return;
        }

        if (!this.options.maintainSelected) {
            this.resetRows();
        }

        this.initPagination();
        if (this.options.sidePagination === 'server') {
            this.initServer();
        } else {
            this.initBody();
        }

        this.trigger('page-change', this.options.pageNumber, this.options.pageSize);
    };

    BootstrapTable.prototype.onPageListChange = function (event) {
        var $this = $(event.currentTarget);

        $this.parent().addClass('active').siblings().removeClass('active');
        this.options.pageSize = $this.text().toUpperCase() === this.options.formatAllRows().toUpperCase() ?
            this.options.formatAllRows() : +$this.text();
        this.$toolbar.find('.page-size').text(this.options.pageSize);

        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPageFirst = function (event) {
        this.options.pageNumber = 1;
        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPagePre = function (event) {
        if ((this.options.pageNumber - 1) == 0) {
            this.options.pageNumber = this.options.totalPages;
        } else {
            this.options.pageNumber--;
        }
        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPageNext = function (event) {
        if ((this.options.pageNumber + 1) > this.options.totalPages) {
            this.options.pageNumber = 1;
        } else {
            this.options.pageNumber++;
        }
        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPageLast = function (event) {
        this.options.pageNumber = this.totalPages;
        this.updatePagination(event);
    };

    BootstrapTable.prototype.onPageNumber = function (event) {
        if (this.options.pageNumber === +$(event.currentTarget).text()) {
            return;
        }
        this.options.pageNumber = +$(event.currentTarget).text();
        this.updatePagination(event);
    };

    BootstrapTable.prototype.initBody = function (fixedScroll) {
        var that = this,
            html = [],
            data = this.getData();

        this.trigger('pre-body', data);

        this.$body = this.$el.find('>tbody');
        if (!this.$body.length) {
            this.$body = $('<tbody></tbody>').appendTo(this.$el);
        }

        //Fix #389 Bootstrap-table-flatJSON is not working

        if (!this.options.pagination || this.options.sidePagination === 'server') {
            this.pageFrom = 1;
            this.pageTo = data.length;
        }

        for (var i = this.pageFrom - 1; i < this.pageTo; i++) {
            var key,
                item = data[i],
                style = {},
                csses = [],
                data_ = '',
                attributes = {},
                htmlAttributes = [];

            style = calculateObjectValue(this.options, this.options.rowStyle, [item, i], style);

            if (style && style.css) {
                for (key in style.css) {
                    csses.push(key + ': ' + style.css[key]);
                }
            }

            attributes = calculateObjectValue(this.options,
                this.options.rowAttributes, [item, i], attributes);

            if (attributes) {
                for (key in attributes) {
                    htmlAttributes.push(sprintf('%s="%s"', key, escapeHTML(attributes[key])));
                }
            }

            if (item._data && !$.isEmptyObject(item._data)) {
                $.each(item._data, function (k, v) {
                    // ignore data-index
                    if (k === 'index') {
                        return;
                    }
                    data_ += sprintf(' data-%s="%s"', k, v);
                });
            }

            html.push('<tr',
                sprintf(' %s', htmlAttributes.join(' ')),
                sprintf(' id="%s"', $.isArray(item) ? undefined : item._id),
                sprintf(' class="%s"', style.classes || ($.isArray(item) ? undefined : item._class)),
                sprintf(' data-index="%s"', i),
                sprintf(' data-uniqueid="%s"', item[this.options.uniqueId]),
                sprintf('%s', data_),
                '>'
            );

            if (this.options.cardView) {
                html.push(sprintf('<td colspan="%s">', this.header.fields.length));
            }

            if (!this.options.cardView && this.options.detailView) {
                html.push('<td>',
                    '<a class="detail-icon" href="javascript:">',
                    sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.detailOpen),
                    '</a>',
                    '</td>');
            }

            $.each(this.header.fields, function (j, field) {
                var text = '',
                    value = getItemField(item, field, that.options.escape),
                    type = '',
                    cellStyle = {},
                    id_ = '',
                    class_ = that.header.classes[j],
                    data_ = '',
                    rowspan_ = '',
                    title_ = '',
                    column = that.columns[getFieldIndex(that.columns, field)];

                if (!column.visible) {
                    return;
                }

                style = sprintf('style="%s"', csses.concat(that.header.styles[j]).join('; '));

                value = calculateObjectValue(column,
                    that.header.formatters[j], [value, item, i], value);

                // handle td's id and class
                if (item['_' + field + '_id']) {
                    id_ = sprintf(' id="%s"', item['_' + field + '_id']);
                }
                if (item['_' + field + '_class']) {
                    class_ = sprintf(' class="%s"', item['_' + field + '_class']);
                }
                if (item['_' + field + '_rowspan']) {
                    rowspan_ = sprintf(' rowspan="%s"', item['_' + field + '_rowspan']);
                }
                if (item['_' + field + '_title']) {
                    title_ = sprintf(' title="%s"', item['_' + field + '_title']);
                }
                cellStyle = calculateObjectValue(that.header,
                    that.header.cellStyles[j], [value, item, i], cellStyle);
                if (cellStyle.classes) {
                    class_ = sprintf(' class="%s"', cellStyle.classes);
                }
                if (cellStyle.css) {
                    var csses_ = [];
                    for (var key in cellStyle.css) {
                        csses_.push(key + ': ' + cellStyle.css[key]);
                    }
                    style = sprintf('style="%s"', csses_.concat(that.header.styles[j]).join('; '));
                }

                if (item['_' + field + '_data'] && !$.isEmptyObject(item['_' + field + '_data'])) {
                    $.each(item['_' + field + '_data'], function (k, v) {
                        // ignore data-index
                        if (k === 'index') {
                            return;
                        }
                        data_ += sprintf(' data-%s="%s"', k, v);
                    });
                }

                if (column.checkbox || column.radio) {
                    type = column.checkbox ? 'checkbox' : type;
                    type = column.radio ? 'radio' : type;

                    text = [sprintf(that.options.cardView ?
                        '<div class="card-view %s">' : '<td class="bs-checkbox %s">', column['class'] || ''),
                        '<input' +
                        sprintf(' data-index="%s"', i) +
                        sprintf(' name="%s"', that.options.selectItemName) +
                        sprintf(' type="%s"', type) +
                        sprintf(' value="%s"', item[that.options.idField]) +
                        sprintf(' checked="%s"', value === true ||
                        (value && value.checked) ? 'checked' : undefined) +
                        sprintf(' disabled="%s"', !column.checkboxEnabled ||
                        (value && value.disabled) ? 'disabled' : undefined) +
                        ' />',
                        that.header.formatters[j] && typeof value === 'string' ? value : '',
                        that.options.cardView ? '</div>' : '</td>'
                    ].join('');

                    item[that.header.stateField] = value === true || (value && value.checked);
                } else {
                    value = typeof value === 'undefined' || value === null ?
                        that.options.undefinedText : value;

                    text = that.options.cardView ? ['<div class="card-view">',
                        that.options.showHeader ? sprintf('<span class="title" %s>%s</span>', style,
                            getPropertyFromOther(that.columns, 'field', 'title', field)) : '',
                        sprintf('<span class="value">%s</span>', value),
                        '</div>'
                    ].join('') : [sprintf('<td%s %s %s %s %s %s>', id_, class_, style, data_, rowspan_, title_),
                        value,
                        '</td>'
                    ].join('');

                    // Hide empty data on Card view when smartDisplay is set to true.
                    if (that.options.cardView && that.options.smartDisplay && value === '') {
                        // Should set a placeholder for event binding correct fieldIndex
                        text = '<div class="card-view"></div>';
                    }
                }

                html.push(text);
            });

            if (this.options.cardView) {
                html.push('</td>');
            }

            html.push('</tr>');
        }

        // show no records
        if (!html.length) {
            html.push('<tr class="no-records-found">',
                sprintf('<td colspan="%s">%s</td>',
                    this.$header.find('th').length, this.options.formatNoMatches()),
                '</tr>');
        }

        this.$body.html(html.join(''));

        if (!fixedScroll) {
            this.scrollTo(0);
        }

        // click to select by column
        this.$body.find('> tr[data-index] > td').off('click dblclick').on('click dblclick', function (e) {
            var $td = $(this),
                $tr = $td.parent(),
                item = that.data[$tr.data('index')],
                index = $td[0].cellIndex,
                field = that.header.fields[that.options.detailView && !that.options.cardView ? index - 1 : index],
                column = that.columns[getFieldIndex(that.columns, field)],
                value = getItemField(item, field, that.options.escape);

            if ($td.find('.detail-icon').length) {
                return;
            }

            that.trigger(e.type === 'click' ? 'click-cell' : 'dbl-click-cell', field, value, item, $td);
            that.trigger(e.type === 'click' ? 'click-row' : 'dbl-click-row', item, $tr);

            // if click to select - then trigger the checkbox/radio click
            if (e.type === 'click' && that.options.clickToSelect && column.clickToSelect) {
                var $selectItem = $tr.find(sprintf('[name="%s"]', that.options.selectItemName));
                if ($selectItem.length) {
                    $selectItem[0].click(); // #144: .trigger('click') bug
                }
            }
        });

        this.$body.find('> tr[data-index] > td > .detail-icon').off('click').on('click', function () {
            var $this = $(this),
                $tr = $this.parent().parent(),
                index = $tr.data('index'),
                row = data[index]; // Fix #980 Detail view, when searching, returns wrong row

            // remove and update
            if ($tr.next().is('tr.detail-view')) {
                $this.find('i').attr('class', sprintf('%s %s', that.options.iconsPrefix, that.options.icons.detailOpen));
                $tr.next().remove();
                that.trigger('collapse-row', index, row);
            } else {
                $this.find('i').attr('class', sprintf('%s %s', that.options.iconsPrefix, that.options.icons.detailClose));
                $tr.after(sprintf('<tr class="detail-view"><td colspan="%s"></td></tr>', $tr.find('td').length));
                var $element = $tr.next().find('td');
                var content = calculateObjectValue(that.options, that.options.detailFormatter, [index, row, $element], '');
                if($element.length === 1) {
                    $element.append(content);
                }
                that.trigger('expand-row', index, row, $element);
            }
            that.resetView();
        });

        this.$selectItem = this.$body.find(sprintf('[name="%s"]', this.options.selectItemName));
        this.$selectItem.off('click').on('click', function (event) {
            event.stopImmediatePropagation();

            var $this = $(this),
                checked = $this.prop('checked'),
                row = that.data[$this.data('index')];

            if (that.options.maintainSelected && $(this).is(':radio')) {
                $.each(that.options.data, function (i, row) {
                    row[that.header.stateField] = false;
                });
            }

            row[that.header.stateField] = checked;

            if (that.options.singleSelect) {
                that.$selectItem.not(this).each(function () {
                    that.data[$(this).data('index')][that.header.stateField] = false;
                });
                that.$selectItem.filter(':checked').not(this).prop('checked', false);
            }

            that.updateSelected();
            that.trigger(checked ? 'check' : 'uncheck', row, $this);
        });

        $.each(this.header.events, function (i, events) {
            if (!events) {
                return;
            }
            // fix bug, if events is defined with namespace
            if (typeof events === 'string') {
                events = calculateObjectValue(null, events);
            }

            var field = that.header.fields[i],
                fieldIndex = $.inArray(field, that.getVisibleFields());

            if (that.options.detailView && !that.options.cardView) {
                fieldIndex += 1;
            }

            for (var key in events) {
                that.$body.find('>tr:not(.no-records-found)').each(function () {
                    var $tr = $(this),
                        $td = $tr.find(that.options.cardView ? '.card-view' : 'td').eq(fieldIndex),
                        index = key.indexOf(' '),
                        name = key.substring(0, index),
                        el = key.substring(index + 1),
                        func = events[key];

                    $td.find(el).off(name).on(name, function (e) {
                        var index = $tr.data('index'),
                            row = that.data[index],
                            value = row[field];

                        func.apply(this, [e, value, row, index]);
                    });
                });
            }
        });

        this.updateSelected();
        this.resetView();

        this.trigger('post-body');
    };

    BootstrapTable.prototype.initServer = function (silent, query) {
        var that = this,
            data = {},
            params = {
                searchText: this.searchText,
                sortName: this.options.sortName,
                sortOrder: this.options.sortOrder
            },
            request;

        if(this.options.pagination) {
            params.pageSize = this.options.pageSize === this.options.formatAllRows() ?
                this.options.totalRows : this.options.pageSize;
            params.pageNumber = this.options.pageNumber;
        }

        if (!this.options.url && !this.options.ajax) {
            return;
        }

        if (this.options.queryParamsType === 'limit') {
            params = {
                search: params.searchText,
                sort: params.sortName,
                order: params.sortOrder
            };
            if (this.options.pagination) {
                params.limit = this.options.pageSize === this.options.formatAllRows() ?
                    this.options.totalRows : this.options.pageSize;
                params.offset = this.options.pageSize === this.options.formatAllRows() ?
                    0 : this.options.pageSize * (this.options.pageNumber - 1);
            }
        }

        if (!($.isEmptyObject(this.filterColumnsPartial))) {
            params['filter'] = JSON.stringify(this.filterColumnsPartial, null);
        }

        data = calculateObjectValue(this.options, this.options.queryParams, [params], data);

        $.extend(data, query || {});

        // false to stop request
        if (data === false) {
            return;
        }

        if (!silent) {
            this.$tableLoading.show();
        }
        request = $.extend({}, calculateObjectValue(null, this.options.ajaxOptions), {
            type: this.options.method,
            url: this.options.url,
            data: this.options.contentType === 'application/json' && this.options.method === 'post' ?
                JSON.stringify(data) : data,
            cache: this.options.cache,
            contentType: this.options.contentType,
            dataType: this.options.dataType,
            success: function (res) {
                res = calculateObjectValue(that.options, that.options.responseHandler, [res], res);

                that.load(res);
                that.trigger('load-success', res);
                if (!silent) that.$tableLoading.hide();
            },
            error: function (res) {
                that.trigger('load-error', res.status, res);
                if (!silent) that.$tableLoading.hide();
            }
        });

        if (this.options.ajax) {
            calculateObjectValue(this, this.options.ajax, [request], null);
        } else {
            $.ajax(request);
        }
    };

    BootstrapTable.prototype.initSearchText = function () {
        if (this.options.search) {
            if (this.options.searchText !== '') {
                var $search = this.$toolbar.find('.search input');
                $search.val(this.options.searchText);
                this.onSearch({currentTarget: $search});
            }
        }
    };

    BootstrapTable.prototype.getCaret = function () {
        var that = this;

        $.each(this.$header.find('th'), function (i, th) {
            $(th).find('.sortable').removeClass('desc asc').addClass($(th).data('field') === that.options.sortName ? that.options.sortOrder : 'both');
        });
    };

    BootstrapTable.prototype.updateSelected = function () {
        var checkAll = this.$selectItem.filter(':enabled').length &&
            this.$selectItem.filter(':enabled').length ===
            this.$selectItem.filter(':enabled').filter(':checked').length;

        this.$selectAll.add(this.$selectAll_).prop('checked', checkAll);

        this.$selectItem.each(function () {
            $(this).closest('tr')[$(this).prop('checked') ? 'addClass' : 'removeClass']('selected');
        });
    };

    BootstrapTable.prototype.updateRows = function () {
        var that = this;

        this.$selectItem.each(function () {
            that.data[$(this).data('index')][that.header.stateField] = $(this).prop('checked');
        });
    };

    BootstrapTable.prototype.resetRows = function () {
        var that = this;

        $.each(this.data, function (i, row) {
            that.$selectAll.prop('checked', false);
            that.$selectItem.prop('checked', false);
            if (that.header.stateField) {
                row[that.header.stateField] = false;
            }
        });
    };

    BootstrapTable.prototype.trigger = function (name) {
        var args = Array.prototype.slice.call(arguments, 1);

        name += '.bs.table';
        this.options[BootstrapTable.EVENTS[name]].apply(this.options, args);
        this.$el.trigger($.Event(name), args);

        this.options.onAll(name, args);
        this.$el.trigger($.Event('all.bs.table'), [name, args]);
    };

    BootstrapTable.prototype.resetHeader = function () {
        // fix #61: the hidden table reset header bug.
        // fix bug: get $el.css('width') error sometime (height = 500)
        clearTimeout(this.timeoutId_);
        this.timeoutId_ = setTimeout($.proxy(this.fitHeader, this), this.$el.is(':hidden') ? 100 : 0);
    };

    BootstrapTable.prototype.fitHeader = function () {
        var that = this,
            fixedBody,
            scrollWidth,
            focused,
            focusedTemp;

        if (that.$el.is(':hidden')) {
            that.timeoutId_ = setTimeout($.proxy(that.fitHeader, that), 100);
            return;
        }
        fixedBody = this.$tableBody.get(0);

        scrollWidth = fixedBody.scrollWidth > fixedBody.clientWidth &&
        fixedBody.scrollHeight > fixedBody.clientHeight + this.$header.outerHeight() ?
            getScrollBarWidth() : 0;

        this.$el.css('margin-top', -this.$header.outerHeight());

        focused = $(':focus');
        if (focused.length > 0) {
            var $th = focused.parents('th');
            if ($th.length > 0) {
                var dataField = $th.attr('data-field');
                if (dataField !== undefined) {
                    var $headerTh = this.$header.find("[data-field='" + dataField + "']");
                    if ($headerTh.length > 0) {
                        $headerTh.find(":input").addClass("focus-temp");
                    }
                }
            }
        }

        this.$header_ = this.$header.clone(true, true);
        this.$selectAll_ = this.$header_.find('[name="btSelectAll"]');
        this.$tableHeader.css({
            'margin-right': scrollWidth
        }).find('table').css('width', this.$el.outerWidth())
            .html('').attr('class', this.$el.attr('class'))
            .append(this.$header_);


        focusedTemp = $('.focus-temp:visible:eq(0)');
        if (focusedTemp.length > 0) {
            focusedTemp.focus();
            this.$header.find('.focus-temp').removeClass('focus-temp');
        }

        // fix bug: $.data() is not working as expected after $.append()
        this.$header.find('th[data-field]').each(function (i) {
            that.$header_.find(sprintf('th[data-field="%s"]', $(this).data('field'))).data($(this).data());
        });

        var visibleFields = this.getVisibleFields();

        this.$body.find('>tr:first-child:not(.no-records-found) > *').each(function (i) {
            var $this = $(this),
                index = i;

            if (that.options.detailView && !that.options.cardView) {
                if (i === 0) {
                    that.$header_.find('th.detail').find('.fht-cell').width($this.innerWidth());
                }
                index = i - 1;
            }

            that.$header_.find(sprintf('th[data-field="%s"]', visibleFields[index]))
                .find('.fht-cell').width($this.innerWidth());
        });
        // horizontal scroll event
        // TODO: it's probably better improving the layout than binding to scroll event
        this.$tableBody.off('scroll').on('scroll', function () {
            that.$tableHeader.scrollLeft($(this).scrollLeft());

            if (that.options.showFooter && !that.options.cardView) {
                that.$tableFooter.scrollLeft($(this).scrollLeft());
            }
        });
        that.trigger('post-header');
    };

    BootstrapTable.prototype.resetFooter = function () {
        var that = this,
            data = that.getData(),
            html = [];

        if (!this.options.showFooter || this.options.cardView) { //do nothing
            return;
        }

        if (!this.options.cardView && this.options.detailView) {
            html.push('<td><div class="th-inner">&nbsp;</div><div class="fht-cell"></div></td>');
        }

        $.each(this.columns, function (i, column) {
            var falign = '', // footer align style
                style = '',
                class_ = sprintf(' class="%s"', column['class']);

            if (!column.visible) {
                return;
            }

            if (that.options.cardView && (!column.cardVisible)) {
                return;
            }

            falign = sprintf('text-align: %s; ', column.falign ? column.falign : column.align);
            style = sprintf('vertical-align: %s; ', column.valign);

            html.push('<td', class_, sprintf(' style="%s"', falign + style), '>');
            html.push('<div class="th-inner">');

            html.push(calculateObjectValue(column, column.footerFormatter, [data], '&nbsp;') || '&nbsp;');

            html.push('</div>');
            html.push('<div class="fht-cell"></div>');
            html.push('</div>');
            html.push('</td>');
        });

        this.$tableFooter.find('tr').html(html.join(''));
        clearTimeout(this.timeoutFooter_);
        this.timeoutFooter_ = setTimeout($.proxy(this.fitFooter, this),
            this.$el.is(':hidden') ? 100 : 0);
    };

    BootstrapTable.prototype.fitFooter = function () {
        var that = this,
            $footerTd,
            elWidth,
            scrollWidth;

        clearTimeout(this.timeoutFooter_);
        if (this.$el.is(':hidden')) {
            this.timeoutFooter_ = setTimeout($.proxy(this.fitFooter, this), 100);
            return;
        }

        elWidth = this.$el.css('width');
        scrollWidth = elWidth > this.$tableBody.width() ? getScrollBarWidth() : 0;

        this.$tableFooter.css({
            'margin-right': scrollWidth
        }).find('table').css('width', elWidth)
            .attr('class', this.$el.attr('class'));

        $footerTd = this.$tableFooter.find('td');

        this.$body.find('>tr:first-child:not(.no-records-found) > *').each(function (i) {
            var $this = $(this);

            $footerTd.eq(i).find('.fht-cell').width($this.innerWidth());
        });
    };

    BootstrapTable.prototype.toggleColumn = function (index, checked, needUpdate) {
        if (index === -1) {
            return;
        }
        this.columns[index].visible = checked;
        this.initHeader();
        this.initSearch();
        this.initPagination();
        this.initBody();

        if (this.options.showColumns) {
            var $items = this.$toolbar.find('.keep-open input').prop('disabled', false);

            if (needUpdate) {
                $items.filter(sprintf('[value="%s"]', index)).prop('checked', checked);
            }

            if ($items.filter(':checked').length <= this.options.minimumCountColumns) {
                $items.filter(':checked').prop('disabled', true);
            }
        }
    };

    BootstrapTable.prototype.toggleRow = function (index, uniqueId, visible) {
        if (index === -1) {
            return;
        }

        this.$body.find(typeof index !== 'undefined' ?
            sprintf('tr[data-index="%s"]', index) :
            sprintf('tr[data-uniqueid="%s"]', uniqueId))
            [visible ? 'show' : 'hide']();
    };

    BootstrapTable.prototype.getVisibleFields = function () {
        var that = this,
            visibleFields = [];

        $.each(this.header.fields, function (j, field) {
            var column = that.columns[getFieldIndex(that.columns, field)];

            if (!column.visible) {
                return;
            }
            visibleFields.push(field);
        });
        return visibleFields;
    };

    // PUBLIC FUNCTION DEFINITION
    // =======================

    BootstrapTable.prototype.resetView = function (params) {
        var padding = 0;

        if (params && params.height) {
            this.options.height = params.height;
        }

        this.$selectAll.prop('checked', this.$selectItem.length > 0 &&
            this.$selectItem.length === this.$selectItem.filter(':checked').length);

        if (this.options.height) {
            var toolbarHeight = getRealHeight(this.$toolbar),
                paginationHeight = getRealHeight(this.$pagination),
                height = this.options.height - toolbarHeight - paginationHeight;

            this.$tableContainer.css('height', height + 'px');
        }

        if (this.options.cardView) {
            // remove the element css
            this.$el.css('margin-top', '0');
            this.$tableContainer.css('padding-bottom', '0');
            return;
        }

        if (this.options.showHeader && this.options.height) {
            this.$tableHeader.show();
            this.resetHeader();
            padding += this.$header.outerHeight();
        } else {
            this.$tableHeader.hide();
            this.trigger('post-header');
        }

        if (this.options.showFooter) {
            this.resetFooter();
            if (this.options.height) {
                padding += this.$tableFooter.outerHeight() + 1;
            }
        }

        // Assign the correct sortable arrow
        this.getCaret();
        this.$tableContainer.css('padding-bottom', padding + 'px');
        this.trigger('reset-view');
    };

    BootstrapTable.prototype.getData = function (useCurrentPage) {
        return (this.searchText || !$.isEmptyObject(this.filterColumns) || !$.isEmptyObject(this.filterColumnsPartial)) ?
            (useCurrentPage ? this.data.slice(this.pageFrom - 1, this.pageTo) : this.data) :
            (useCurrentPage ? this.options.data.slice(this.pageFrom - 1, this.pageTo) : this.options.data);
    };

    BootstrapTable.prototype.load = function (data) {
        var fixedScroll = false;

        // #431: support pagination
        if (this.options.sidePagination === 'server') {
            this.options.totalRows = data.total;
            fixedScroll = data.fixedScroll;
            data = data[this.options.dataField];
        } else if (!$.isArray(data)) { // support fixedScroll
            fixedScroll = data.fixedScroll;
            data = data.data;
        }

        this.initData(data);
        this.initSearch();
        this.initPagination();
        this.initBody(fixedScroll);
    };

    BootstrapTable.prototype.append = function (data) {
        this.initData(data, 'append');
        this.initSearch();
        this.initPagination();
        this.initSort();
        this.initBody(true);
    };

    BootstrapTable.prototype.prepend = function (data) {
        this.initData(data, 'prepend');
        this.initSearch();
        this.initPagination();
        this.initSort();
        this.initBody(true);
    };

    BootstrapTable.prototype.remove = function (params) {
        var len = this.options.data.length,
            i, row;

        if (!params.hasOwnProperty('field') || !params.hasOwnProperty('values')) {
            return;
        }

        for (i = len - 1; i >= 0; i--) {
            row = this.options.data[i];

            if (!row.hasOwnProperty(params.field)) {
                continue;
            }
            if ($.inArray(row[params.field], params.values) !== -1) {
                this.options.data.splice(i, 1);
            }
        }

        if (len === this.options.data.length) {
            return;
        }

        this.initSearch();
        this.initPagination();
        this.initSort();
        this.initBody(true);
    };

    BootstrapTable.prototype.removeAll = function () {
        if (this.options.data.length > 0) {
            this.options.data.splice(0, this.options.data.length);
            this.initSearch();
            this.initPagination();
            this.initBody(true);
        }
    };

    BootstrapTable.prototype.getRowByUniqueId = function (id) {
        var uniqueId = this.options.uniqueId,
            len = this.options.data.length,
            dataRow = null,
            i, row, rowUniqueId;

        for (i = len - 1; i >= 0; i--) {
            row = this.options.data[i];

            if (row.hasOwnProperty(uniqueId)) { // uniqueId is a column
                rowUniqueId = row[uniqueId];
            } else if(row._data.hasOwnProperty(uniqueId)) { // uniqueId is a row data property
                rowUniqueId = row._data[uniqueId];
            } else {
                continue;
            }

            if (typeof rowUniqueId === 'string') {
                id = id.toString();
            } else if (typeof rowUniqueId === 'number') {
                if ((Number(rowUniqueId) === rowUniqueId) && (rowUniqueId % 1 === 0)) {
                    id = parseInt(id);
                } else if ((rowUniqueId === Number(rowUniqueId)) && (rowUniqueId !== 0)) {
                    id = parseFloat(id);
                }
            }

            if (rowUniqueId === id) {
                dataRow = row;
                break;
            }
        }

        return dataRow;
    };

    BootstrapTable.prototype.removeByUniqueId = function (id) {
        var len = this.options.data.length,
            row = this.getRowByUniqueId(id);

        if (row) {
            this.options.data.splice(this.options.data.indexOf(row), 1);
        }

        if (len === this.options.data.length) {
            return;
        }

        this.initSearch();
        this.initPagination();
        this.initBody(true);
    };

    BootstrapTable.prototype.updateByUniqueId = function (params) {
        var rowId;

        if (!params.hasOwnProperty('id') || !params.hasOwnProperty('row')) {
            return;
        }

        rowId = $.inArray(this.getRowByUniqueId(params.id), this.options.data);

        if (rowId === -1) {
            return;
        }

        $.extend(this.data[rowId], params.row);
        this.initSort();
        this.initBody(true);
    };

    BootstrapTable.prototype.insertRow = function (params) {
        if (!params.hasOwnProperty('index') || !params.hasOwnProperty('row')) {
            return;
        }
        this.data.splice(params.index, 0, params.row);
        this.initSearch();
        this.initPagination();
        this.initSort();
        this.initBody(true);
    };

    BootstrapTable.prototype.updateRow = function (params) {
        if (!params.hasOwnProperty('index') || !params.hasOwnProperty('row')) {
            return;
        }
        $.extend(this.data[params.index], params.row);
        this.initSort();
        this.initBody(true);
    };

    BootstrapTable.prototype.showRow = function (params) {
        if (!params.hasOwnProperty('index') && !params.hasOwnProperty('uniqueId')) {
            return;
        }
        this.toggleRow(params.index, params.uniqueId, true);
    };

    BootstrapTable.prototype.hideRow = function (params) {
        if (!params.hasOwnProperty('index') && !params.hasOwnProperty('uniqueId')) {
            return;
        }
        this.toggleRow(params.index, params.uniqueId, false);
    };

    BootstrapTable.prototype.getRowsHidden = function (show) {
        var rows = $(this.$body[0]).children().filter(':hidden'),
            i = 0;
        if (show) {
            for (; i < rows.length; i++) {
                $(rows[i]).show();
            }
        }
        return rows;
    };

    BootstrapTable.prototype.mergeCells = function (options) {
        var row = options.index,
            col = $.inArray(options.field, this.getVisibleFields()),
            rowspan = options.rowspan || 1,
            colspan = options.colspan || 1,
            i, j,
            $tr = this.$body.find('>tr'),
            $td;

        if (this.options.detailView && !this.options.cardView) {
            col += 1;
        }

        $td = $tr.eq(row).find('>td').eq(col);

        if (row < 0 || col < 0 || row >= this.data.length) {
            return;
        }

        for (i = row; i < row + rowspan; i++) {
            for (j = col; j < col + colspan; j++) {
                $tr.eq(i).find('>td').eq(j).hide();
            }
        }

        $td.attr('rowspan', rowspan).attr('colspan', colspan).show();
    };

    BootstrapTable.prototype.updateCell = function (params) {
        if (!params.hasOwnProperty('index') ||
            !params.hasOwnProperty('field') ||
            !params.hasOwnProperty('value')) {
            return;
        }
        this.data[params.index][params.field] = params.value;

        if (params.reinit === false) {
            return;
        }
        this.initSort();
        this.initBody(true);
    };

    BootstrapTable.prototype.getOptions = function () {
        return this.options;
    };

    BootstrapTable.prototype.getSelections = function () {
        var that = this;

        return $.grep(this.data, function (row) {
            return row[that.header.stateField];
        });
    };

    BootstrapTable.prototype.getAllSelections = function () {
        var that = this;

        return $.grep(this.options.data, function (row) {
            return row[that.header.stateField];
        });
    };

    BootstrapTable.prototype.checkAll = function () {
        this.checkAll_(true);
    };

    BootstrapTable.prototype.uncheckAll = function () {
        this.checkAll_(false);
    };

    BootstrapTable.prototype.checkInvert = function () {
        var that = this;
        var rows = that.$selectItem.filter(':enabled');
        var checked = rows.filter(':checked');
        rows.each(function() {
            $(this).prop('checked', !$(this).prop('checked'));
        });
        that.updateRows();
        that.updateSelected();
        that.trigger('uncheck-some', checked);
        checked = that.getSelections();
        that.trigger('check-some', checked);
    };

    BootstrapTable.prototype.checkAll_ = function (checked) {
        var rows;
        if (!checked) {
            rows = this.getSelections();
        }
        this.$selectAll.add(this.$selectAll_).prop('checked', checked);
        this.$selectItem.filter(':enabled').prop('checked', checked);
        this.updateRows();
        if (checked) {
            rows = this.getSelections();
        }
        this.trigger(checked ? 'check-all' : 'uncheck-all', rows);
    };

    BootstrapTable.prototype.check = function (index) {
        this.check_(true, index);
    };

    BootstrapTable.prototype.uncheck = function (index) {
        this.check_(false, index);
    };

    BootstrapTable.prototype.check_ = function (checked, index) {
        var $el = this.$selectItem.filter(sprintf('[data-index="%s"]', index)).prop('checked', checked);
        this.data[index][this.header.stateField] = checked;
        this.updateSelected();
        this.trigger(checked ? 'check' : 'uncheck', this.data[index], $el);
    };

    BootstrapTable.prototype.checkBy = function (obj) {
        this.checkBy_(true, obj);
    };

    BootstrapTable.prototype.uncheckBy = function (obj) {
        this.checkBy_(false, obj);
    };

    BootstrapTable.prototype.checkBy_ = function (checked, obj) {
        if (!obj.hasOwnProperty('field') || !obj.hasOwnProperty('values')) {
            return;
        }

        var that = this,
            rows = [];
        $.each(this.options.data, function (index, row) {
            if (!row.hasOwnProperty(obj.field)) {
                return false;
            }
            if ($.inArray(row[obj.field], obj.values) !== -1) {
                var $el = that.$selectItem.filter(':enabled')
                    .filter(sprintf('[data-index="%s"]', index)).prop('checked', checked);
                row[that.header.stateField] = checked;
                rows.push(row);
                that.trigger(checked ? 'check' : 'uncheck', row, $el);
            }
        });
        this.updateSelected();
        this.trigger(checked ? 'check-some' : 'uncheck-some', rows);
    };

    BootstrapTable.prototype.destroy = function () {
        this.$el.insertBefore(this.$container);
        $(this.options.toolbar).insertBefore(this.$el);
        this.$container.next().remove();
        this.$container.remove();
        this.$el.html(this.$el_.html())
            .css('margin-top', '0')
            .attr('class', this.$el_.attr('class') || ''); // reset the class
    };

    BootstrapTable.prototype.showLoading = function () {
        this.$tableLoading.show();
    };

    BootstrapTable.prototype.hideLoading = function () {
        this.$tableLoading.hide();
    };

    BootstrapTable.prototype.togglePagination = function () {
        this.options.pagination = !this.options.pagination;
        var button = this.$toolbar.find('button[name="paginationSwitch"] i');
        if (this.options.pagination) {
            button.attr("class", this.options.iconsPrefix + " " + this.options.icons.paginationSwitchDown);
        } else {
            button.attr("class", this.options.iconsPrefix + " " + this.options.icons.paginationSwitchUp);
        }
        this.updatePagination();
    };

    BootstrapTable.prototype.refresh = function (params) {
        if (params && params.url) {
            this.options.url = params.url;
            this.options.pageNumber = 1;
        }
        this.initServer(params && params.silent, params && params.query);
    };

    BootstrapTable.prototype.resetWidth = function () {
        if (this.options.showHeader && this.options.height) {
            this.fitHeader();
        }
        if (this.options.showFooter) {
            this.fitFooter();
        }
    };

    BootstrapTable.prototype.showColumn = function (field) {
        this.toggleColumn(getFieldIndex(this.columns, field), true, true);
    };

    BootstrapTable.prototype.hideColumn = function (field) {
        this.toggleColumn(getFieldIndex(this.columns, field), false, true);
    };

    BootstrapTable.prototype.getHiddenColumns = function () {
        return $.grep(this.columns, function (column) {
            return !column.visible;
        });
    };

    BootstrapTable.prototype.filterBy = function (columns) {
        this.filterColumns = $.isEmptyObject(columns) ? {} : columns;
        this.options.pageNumber = 1;
        this.initSearch();
        this.updatePagination();
    };

    BootstrapTable.prototype.scrollTo = function (value) {
        if (typeof value === 'string') {
            value = value === 'bottom' ? this.$tableBody[0].scrollHeight : 0;
        }
        if (typeof value === 'number') {
            this.$tableBody.scrollTop(value);
        }
        if (typeof value === 'undefined') {
            return this.$tableBody.scrollTop();
        }
    };

    BootstrapTable.prototype.getScrollPosition = function () {
        return this.scrollTo();
    };

    BootstrapTable.prototype.selectPage = function (page) {
        if (page > 0 && page <= this.options.totalPages) {
            this.options.pageNumber = page;
            this.updatePagination();
        }
    };

    BootstrapTable.prototype.prevPage = function () {
        if (this.options.pageNumber > 1) {
            this.options.pageNumber--;
            this.updatePagination();
        }
    };

    BootstrapTable.prototype.nextPage = function () {
        if (this.options.pageNumber < this.options.totalPages) {
            this.options.pageNumber++;
            this.updatePagination();
        }
    };

    BootstrapTable.prototype.toggleView = function () {
        this.options.cardView = !this.options.cardView;
        this.initHeader();
        // Fixed remove toolbar when click cardView button.
        //that.initToolbar();
        this.initBody();
        this.trigger('toggle', this.options.cardView);
    };

    BootstrapTable.prototype.refreshOptions = function (options) {
        //If the objects are equivalent then avoid the call of destroy / init methods
        if (compareObjects(this.options, options, true)) {
            return;
        }
        this.options = $.extend(this.options, options);
        this.trigger('refresh-options', this.options);
        this.destroy();
        this.init();
    };

    BootstrapTable.prototype.resetSearch = function (text) {
        var $search = this.$toolbar.find('.search input');
        $search.val(text || '');
        this.onSearch({currentTarget: $search});
    };

    BootstrapTable.prototype.expandRow_ = function (expand, index) {
        var $tr = this.$body.find(sprintf('> tr[data-index="%s"]', index));
        if ($tr.next().is('tr.detail-view') === (expand ? false : true)) {
            $tr.find('> td > .detail-icon').click();
        }
    };

    BootstrapTable.prototype.expandRow = function (index) {
        this.expandRow_(true, index);
    };

    BootstrapTable.prototype.collapseRow = function (index) {
        this.expandRow_(false, index);
    };

    BootstrapTable.prototype.expandAllRows = function (isSubTable) {
        if (isSubTable) {
            var $tr = this.$body.find(sprintf('> tr[data-index="%s"]', 0)),
                that = this,
                detailIcon = null,
                executeInterval = false,
                idInterval = -1;

            if (!$tr.next().is('tr.detail-view')) {
                $tr.find('> td > .detail-icon').click();
                executeInterval = true;
            } else if (!$tr.next().next().is('tr.detail-view')) {
                $tr.next().find(".detail-icon").click();
                executeInterval = true;
            }

            if (executeInterval) {
                try {
                    idInterval = setInterval(function () {
                        detailIcon = that.$body.find("tr.detail-view").last().find(".detail-icon");
                        if (detailIcon.length > 0) {
                            detailIcon.click();
                        } else {
                            clearInterval(idInterval);
                        }
                    }, 1);
                } catch (ex) {
                    clearInterval(idInterval);
                }
            }
        } else {
            var trs = this.$body.children();
            for (var i = 0; i < trs.length; i++) {
                this.expandRow_(true, $(trs[i]).data("index"));
            }
        }
    };

    BootstrapTable.prototype.collapseAllRows = function (isSubTable) {
        if (isSubTable) {
            this.expandRow_(false, 0);
        } else {
            var trs = this.$body.children();
            for (var i = 0; i < trs.length; i++) {
                this.expandRow_(false, $(trs[i]).data("index"));
            }
        }
    };

    BootstrapTable.prototype.updateFormatText = function (name, text) {
        if (this.options[sprintf('format%s', name)]) {
            if (typeof text === 'string') {
                this.options[sprintf('format%s', name)] = function () {
                    return text;
                };
            } else if (typeof text === 'function') {
                this.options[sprintf('format%s', name)] = text;
            }
        }
        this.initToolbar();
        this.initPagination();
        this.initBody();
    };

    // BOOTSTRAP TABLE PLUGIN DEFINITION
    // =======================

    var allowedMethods = [
        'getOptions',
        'getSelections', 'getAllSelections', 'getData',
        'load', 'append', 'prepend', 'remove', 'removeAll',
        'insertRow', 'updateRow', 'updateCell', 'updateByUniqueId', 'removeByUniqueId',
        'getRowByUniqueId', 'showRow', 'hideRow', 'getRowsHidden',
        'mergeCells',
        'checkAll', 'uncheckAll', 'checkInvert',
        'check', 'uncheck',
        'checkBy', 'uncheckBy',
        'refresh',
        'resetView',
        'resetWidth',
        'destroy',
        'showLoading', 'hideLoading',
        'showColumn', 'hideColumn', 'getHiddenColumns',
        'filterBy',
        'scrollTo',
        'getScrollPosition',
        'selectPage', 'prevPage', 'nextPage',
        'togglePagination',
        'toggleView',
        'refreshOptions',
        'resetSearch',
        'expandRow', 'collapseRow', 'expandAllRows', 'collapseAllRows',
        'updateFormatText'
    ];

    $.fn.bootstrapTable = function (option) {
        var value,
            args = Array.prototype.slice.call(arguments, 1);

        this.each(function () {
            var $this = $(this),
                data = $this.data('bootstrap.table'),
                options = $.extend({}, BootstrapTable.DEFAULTS, $this.data(),
                    typeof option === 'object' && option);

            if (typeof option === 'string') {
                if ($.inArray(option, allowedMethods) < 0) {
                    throw new Error("Unknown method: " + option);
                }

                if (!data) {
                    return;
                }

                value = data[option].apply(data, args);

                if (option === 'destroy') {
                    $this.removeData('bootstrap.table');
                }
            }

            if (!data) {
                $this.data('bootstrap.table', (data = new BootstrapTable(this, options)));
            }
        });

        return typeof value === 'undefined' ? this : value;
    };

    $.fn.bootstrapTable.Constructor = BootstrapTable;
    $.fn.bootstrapTable.defaults = BootstrapTable.DEFAULTS;
    $.fn.bootstrapTable.columnDefaults = BootstrapTable.COLUMN_DEFAULTS;
    $.fn.bootstrapTable.locales = BootstrapTable.LOCALES;
    $.fn.bootstrapTable.methods = allowedMethods;
    $.fn.bootstrapTable.utils = {
        sprintf: sprintf,
        getFieldIndex: getFieldIndex,
        compareObjects: compareObjects,
        calculateObjectValue: calculateObjectValue
    };

    // BOOTSTRAP TABLE INIT
    // =======================

    $(function () {
        $('[data-toggle="table"]').bootstrapTable();
    });
}(jQuery);
/*
 * bootstrap-table - v1.10.1 - 2016-02-17
 * https://github.com/wenzhixin/bootstrap-table
 * Copyright (c) 2016 zhixin wen
 * Licensed MIT License
 */
! function(a) {
	"use strict";
	a.extend(a.fn.bootstrapTable.defaults, {
		editable: !0,
		onEditableInit: function() {
			return !1
		},
		onEditableSave: function() {
			return !1
		},
		onEditableShown: function() {
			return !1
		},
		onEditableHidden: function() {
			return !1
		}
	}), a.extend(a.fn.bootstrapTable.Constructor.EVENTS, {
		"editable-init.bs.table": "onEditableInit",
		"editable-save.bs.table": "onEditableSave",
		"editable-shown.bs.table": "onEditableShown",
		"editable-hidden.bs.table": "onEditableHidden"
	});
	var b = a.fn.bootstrapTable.Constructor,
		c = b.prototype.initTable,
		d = b.prototype.initBody;
	b.prototype.initTable = function() {
		var b = this;
		c.apply(this, Array.prototype.slice.apply(arguments)), this.options.editable && a.each(this.columns, function(c, d) {
			if (d.editable) {
				var e = {},
					f = [],
					g = "editable-",
					h = function(a, b) {
						var c = a.replace(/([A-Z])/g, function(a) {
							return "-" + a.toLowerCase()
						});
						if (c.slice(0, g.length) == g) {
							var d = c.replace(g, "data-");
							e[d] = b
						}
					};
				a.each(b.options, h);
				var i = d.formatter;
				d.formatter = function(c, g, j) {
					var k = i ? i(c, g, j) : c;
					return a.each(d, h), a.each(e, function(a, b) {
						f.push(" " + a + '="' + b + '"')
					}), ['<a href="javascript:void(0)"', ' data-name="' + d.field + '"', ' data-pk="' + g[b.options.idField] + '"', ' data-value="' + k + '"', f.join(""), "></a>"].join("")
				}
			}
		})
	}, b.prototype.initBody = function() {
		var b = this;
		d.apply(this, Array.prototype.slice.apply(arguments)), this.options.editable && (a.each(this.columns, function(c, d) {
			d.editable && (b.$body.find('a[data-name="' + d.field + '"]').editable(d.editable).off("save").on("save", function(c, e) {
				var f = b.getData(),
					g = a(this).parents("tr[data-index]").data("index"),
					h = f[g],
					i = h[d.field];
				a(this).data("value", e.submitValue), h[d.field] = e.submitValue, b.trigger("editable-save", d.field, h, i, a(this))
			}), b.$body.find('a[data-name="' + d.field + '"]').editable(d.editable).off("shown").on("shown", function(c, e) {
				var f = b.getData(),
					g = a(this).parents("tr[data-index]").data("index"),
					h = f[g];
				b.trigger("editable-shown", d.field, h, a(this), e)
			}), b.$body.find('a[data-name="' + d.field + '"]').editable(d.editable).off("hidden").on("hidden", function(c, e) {
				var f = b.getData(),
					g = a(this).parents("tr[data-index]").data("index"),
					h = f[g];
				b.trigger("editable-hidden", d.field, h, a(this), e)
			}))
		}), this.trigger("editable-init"))
	}
}(jQuery);
/*! X-editable - v1.5.1 
 * In-place editing with Twitter Bootstrap, jQuery UI or pure jQuery
 * http://github.com/vitalets/x-editable
 * Copyright (c) 2013 Vitaliy Potapov; Licensed MIT */
/**
Form with single input element, two buttons and two states: normal/loading.
Applied as jQuery method to DIV tag (not to form tag!). This is because form can be in loading state when spinner shown.
Editableform is linked with one of input types, e.g. 'text', 'select' etc.

@class editableform
@uses text
@uses textarea
**/
(function($) {
	"use strict";

	var EditableForm = function(div, options) {
		this.options = $.extend({}, $.fn.editableform.defaults, options);
		this.$div = $(div); //div, containing form. Not form tag. Not editable-element.
		if (!this.options.scope) {
			this.options.scope = this;
		}
		//nothing shown after init
	};

	EditableForm.prototype = {
		constructor: EditableForm,
		initInput: function() { //called once
			//take input from options (as it is created in editable-element)
			this.input = this.options.input;

			//set initial value
			//todo: may be add check: typeof str === 'string' ? 
			this.value = this.input.str2value(this.options.value);

			//prerender: get input.$input
			this.input.prerender();
		},
		initTemplate: function() {
			this.$form = $($.fn.editableform.template);
		},
		initButtons: function() {
			var $btn = this.$form.find('.editable-buttons');
			$btn.append($.fn.editableform.buttons);
			if (this.options.showbuttons === 'bottom') {
				$btn.addClass('editable-buttons-bottom');
			}
		},
		/**
		Renders editableform

		@method render
		**/
		render: function() {
			//init loader
			this.$loading = $($.fn.editableform.loading);
			this.$div.empty().append(this.$loading);

			//init form template and buttons
			this.initTemplate();
			if (this.options.showbuttons) {
				this.initButtons();
			} else {
				this.$form.find('.editable-buttons').remove();
			}

			//show loading state
			this.showLoading();

			//flag showing is form now saving value to server. 
			//It is needed to wait when closing form.
			this.isSaving = false;

			/**        
			Fired when rendering starts
			@event rendering 
			@param {Object} event event object
			**/
			this.$div.triggerHandler('rendering');

			//init input
			this.initInput();

			//append input to form
			this.$form.find('div.editable-input').append(this.input.$tpl);

			//append form to container
			this.$div.append(this.$form);

			//render input
			$.when(this.input.render())
				.then($.proxy(function() {
					//setup input to submit automatically when no buttons shown
					if (!this.options.showbuttons) {
						this.input.autosubmit();
					}

					//attach 'cancel' handler
					this.$form.find('.editable-cancel').click($.proxy(this.cancel, this));

					if (this.input.error) {
						this.error(this.input.error);
						this.$form.find('.editable-submit').attr('disabled', true);
						this.input.$input.attr('disabled', true);
						//prevent form from submitting
						this.$form.submit(function(e) {
							e.preventDefault();
						});
					} else {
						this.error(false);
						this.input.$input.removeAttr('disabled');
						this.$form.find('.editable-submit').removeAttr('disabled');
						var value = (this.value === null || this.value === undefined || this.value === '') ? this.options.defaultValue : this.value;
						this.input.value2input(value);
						//attach submit handler
						this.$form.submit($.proxy(this.submit, this));

					}

					/**        
					Fired when form is rendered
					@event rendered
					@param {Object} event event object
					**/
					this.$div.triggerHandler('rendered');

					this.showForm();

					//call postrender method to perform actions required visibility of form
					if (this.input.postrender) {
						this.input.postrender();
					}
				}, this));
		},
		cancel: function() {
			/**        
			Fired when form was cancelled by user
			@event cancel 
			@param {Object} event event object
			**/
			this.$div.triggerHandler('cancel');
		},
		showLoading: function() {
			var w, h;
			if (this.$form) {
				//set loading size equal to form
				w = this.$form.outerWidth();
				h = this.$form.outerHeight();
				if (w) {
					this.$loading.width(w);
				}
				if (h) {
					this.$loading.height(h);
				}
				this.$form.hide();
			} else {
				//stretch loading to fill container width
				w = this.$loading.parent().width();
				if (w) {
					this.$loading.width(w);
				}
			}
			this.$loading.show();
		},

		showForm: function(activate) {
			this.$loading.hide();
			this.$form.show();
			if (activate !== false) {
				this.input.activate();
			}
			/**        
			Fired when form is shown
			@event show 
			@param {Object} event event object
			**/
			this.$div.triggerHandler('show');
		},

		error: function(msg) {
			var $group = this.$form.find('.control-group'),
				$block = this.$form.find('.editable-error-block'),
				lines;

			if (msg === false) {
				$group.removeClass($.fn.editableform.errorGroupClass);
				$block.removeClass($.fn.editableform.errorBlockClass).empty().hide();
			} else {
				//convert newline to <br> for more pretty error display
				if (msg) {
					lines = ('' + msg).split('\n');
					for (var i = 0; i < lines.length; i++) {
						lines[i] = $('<div>').text(lines[i]).html();
					}
					msg = lines.join('<br>');
				}
				$group.addClass($.fn.editableform.errorGroupClass);
				$block.addClass($.fn.editableform.errorBlockClass).html(msg).show();
			}
		},

		submit: function(e) {
			e.stopPropagation();
			e.preventDefault();

			//get new value from input
			var newValue = this.input.input2value();

			//validation: if validate returns string or truthy value - means error
			//if returns object like {newValue: '...'} => submitted value is reassigned to it
			var error = this.validate(newValue);
			if ($.type(error) === 'object' && error.newValue !== undefined) {
				newValue = error.newValue;
				this.input.value2input(newValue);
				if (typeof error.msg === 'string') {
					this.error(error.msg);
					this.showForm();
					return;
				}
			} else if (error) {
				this.error(error);
				this.showForm();
				return;
			}

			//if value not changed --> trigger 'nochange' event and return
			/*jslint eqeq: true*/
			if (!this.options.savenochange && this.input.value2str(newValue) == this.input.value2str(this.value)) {
				/*jslint eqeq: false*/
				/**        
				Fired when value not changed but form is submitted. Requires savenochange = false.
				@event nochange 
				@param {Object} event event object
				**/
				this.$div.triggerHandler('nochange');
				return;
			}

			//convert value for submitting to server
			var submitValue = this.input.value2submit(newValue);

			this.isSaving = true;

			//sending data to server
			$.when(this.save(submitValue))
				.done($.proxy(function(response) {
					this.isSaving = false;

					//run success callback
					var res = typeof this.options.success === 'function' ? this.options.success.call(this.options.scope, response, newValue) : null;

					//if success callback returns false --> keep form open and do not activate input
					if (res === false) {
						this.error(false);
						this.showForm(false);
						return;
					}

					//if success callback returns string -->  keep form open, show error and activate input               
					if (typeof res === 'string') {
						this.error(res);
						this.showForm();
						return;
					}

					//if success callback returns object like {newValue: <something>} --> use that value instead of submitted
					//it is usefull if you want to chnage value in url-function
					if (res && typeof res === 'object' && res.hasOwnProperty('newValue')) {
						newValue = res.newValue;
					}

					//clear error message
					this.error(false);
					this.value = newValue;
					/**        
					Fired when form is submitted
					@event save 
					@param {Object} event event object
					@param {Object} params additional params
					@param {mixed} params.newValue raw new value
					@param {mixed} params.submitValue submitted value as string
					@param {Object} params.response ajax response

					@example
					$('#form-div').on('save'), function(e, params){
					    if(params.newValue === 'username') {...}
					});
					**/
					this.$div.triggerHandler('save', {
						newValue: newValue,
						submitValue: submitValue,
						response: response
					});
				}, this))
				.fail($.proxy(function(xhr) {
					this.isSaving = false;

					var msg;
					if (typeof this.options.error === 'function') {
						msg = this.options.error.call(this.options.scope, xhr, newValue);
					} else {
						msg = typeof xhr === 'string' ? xhr : xhr.responseText || xhr.statusText || 'Unknown error!';
					}

					this.error(msg);
					this.showForm();
				}, this));
		},

		save: function(submitValue) {
			//try parse composite pk defined as json string in data-pk 
			this.options.pk = $.fn.editableutils.tryParseJson(this.options.pk, true);

			var pk = (typeof this.options.pk === 'function') ? this.options.pk.call(this.options.scope) : this.options.pk,
				/*
				  send on server in following cases:
				  1. url is function
				  2. url is string AND (pk defined OR send option = always) 
				*/
				send = !!(typeof this.options.url === 'function' || (this.options.url && ((this.options.send === 'always') || (this.options.send === 'auto' && pk !== null && pk !== undefined)))),
				params;

			if (send) { //send to server
				this.showLoading();

				//standard params
				params = {
					name: this.options.name || '',
					value: submitValue,
					pk: pk
				};

				//additional params
				if (typeof this.options.params === 'function') {
					params = this.options.params.call(this.options.scope, params);
				} else {
					//try parse json in single quotes (from data-params attribute)
					this.options.params = $.fn.editableutils.tryParseJson(this.options.params, true);
					$.extend(params, this.options.params);
				}

				if (typeof this.options.url === 'function') { //user's function
					return this.options.url.call(this.options.scope, params);
				} else {
					//send ajax to server and return deferred object
					return $.ajax($.extend({
						url: this.options.url,
						data: params,
						type: 'POST'
					}, this.options.ajaxOptions));
				}
			}
		},

		validate: function(value) {
			if (value === undefined) {
				value = this.value;
			}
			if (typeof this.options.validate === 'function') {
				return this.options.validate.call(this.options.scope, value);
			}
		},

		option: function(key, value) {
			if (key in this.options) {
				this.options[key] = value;
			}

			if (key === 'value') {
				this.setValue(value);
			}

			//do not pass option to input as it is passed in editable-element
		},

		setValue: function(value, convertStr) {
			if (convertStr) {
				this.value = this.input.str2value(value);
			} else {
				this.value = value;
			}

			//if form is visible, update input
			if (this.$form && this.$form.is(':visible')) {
				this.input.value2input(this.value);
			}
		}
	};

	/*
	Initialize editableform. Applied to jQuery object.

	@method $().editableform(options)
	@params {Object} options
	@example
	var $form = $('&lt;div&gt;').editableform({
	    type: 'text',
	    name: 'username',
	    url: '/post',
	    value: 'vitaliy'
	});

	//to display form you should call 'render' method
	$form.editableform('render');     
	*/
	$.fn.editableform = function(option) {
		var args = arguments;
		return this.each(function() {
			var $this = $(this),
				data = $this.data('editableform'),
				options = typeof option === 'object' && option;
			if (!data) {
				$this.data('editableform', (data = new EditableForm(this, options)));
			}

			if (typeof option === 'string') { //call method 
				data[option].apply(data, Array.prototype.slice.call(args, 1));
			}
		});
	};

	//keep link to constructor to allow inheritance
	$.fn.editableform.Constructor = EditableForm;

	//defaults
	$.fn.editableform.defaults = {
		/* see also defaults for input */

		/**
		Type of input. Can be <code>text|textarea|select|date|checklist</code>

		@property type 
		@type string
		@default 'text'
		**/
		type: 'text',
		/**
		Url for submit, e.g. <code>'/post'</code>  
		If function - it will be called instead of ajax. Function should return deferred object to run fail/done callbacks.

		@property url 
		@type string|function
		@default null
		@example
		url: function(params) {
		    var d = new $.Deferred;
		    if(params.value === 'abc') {
		        return d.reject('error message'); //returning error via deferred object
		    } else {
		        //async saving data in js model
		        someModel.asyncSaveMethod({
		           ..., 
		           success: function(){
		              d.resolve();
		           }
		        }); 
		        return d.promise();
		    }
		} 
		**/
		url: null,
		/**
		Additional params for submit. If defined as <code>object</code> - it is **appended** to original ajax data (pk, name and value).  
		If defined as <code>function</code> - returned object **overwrites** original ajax data.
		@example
		params: function(params) {
		    //originally params contain pk, name and value
		    params.a = 1;
		    return params;
		}

		@property params 
		@type object|function
		@default null
		**/
		params: null,
		/**
		Name of field. Will be submitted on server. Can be taken from <code>id</code> attribute

		@property name 
		@type string
		@default null
		**/
		name: null,
		/**
		Primary key of editable object (e.g. record id in database). For composite keys use object, e.g. <code>{id: 1, lang: 'en'}</code>.
		Can be calculated dynamically via function.

		@property pk 
		@type string|object|function
		@default null
		**/
		pk: null,
		/**
		Initial value. If not defined - will be taken from element's content.
		For __select__ type should be defined (as it is ID of shown text).

		@property value 
		@type string|object
		@default null
		**/
		value: null,
		/**
		Value that will be displayed in input if original field value is empty (`null|undefined|''`).

		@property defaultValue 
		@type string|object
		@default null
		@since 1.4.6
		**/
		defaultValue: null,
		/**
		Strategy for sending data on server. Can be `auto|always|never`.
		When 'auto' data will be sent on server **only if pk and url defined**, otherwise new value will be stored locally.

		@property send 
		@type string
		@default 'auto'
		**/
		send: 'auto',
		/**
		Function for client-side validation. If returns string - means validation not passed and string showed as error.
		Since 1.5.1 you can modify submitted value by returning object from `validate`: 
		`{newValue: '...'}` or `{newValue: '...', msg: '...'}`

		@property validate 
		@type function
		@default null
		@example
		validate: function(value) {
		    if($.trim(value) == '') {
		        return 'This field is required';
		    }
		}
		**/
		validate: null,
		/**
		Success callback. Called when value successfully sent on server and **response status = 200**.  
		Usefull to work with json response. For example, if your backend response can be <code>{success: true}</code>
		or <code>{success: false, msg: "server error"}</code> you can check it inside this callback.  
		If it returns **string** - means error occured and string is shown as error message.  
		If it returns **object like** <code>{newValue: &lt;something&gt;}</code> - it overwrites value, submitted by user.  
		Otherwise newValue simply rendered into element.
        
		@property success 
		@type function
		@default null
		@example
		success: function(response, newValue) {
		    if(!response.success) return response.msg;
		}
		**/
		success: null,
		/**
		Error callback. Called when request failed (response status != 200).  
		Usefull when you want to parse error response and display a custom message.
		Must return **string** - the message to be displayed in the error block.
		        
		@property error 
		@type function
		@default null
		@since 1.4.4
		@example
		error: function(response, newValue) {
		    if(response.status === 500) {
		        return 'Service unavailable. Please try later.';
		    } else {
		        return response.responseText;
		    }
		}
		**/
		error: null,
		/**
		Additional options for submit ajax request.
		List of values: http://api.jquery.com/jQuery.ajax
        
		@property ajaxOptions 
		@type object
		@default null
		@since 1.1.1        
		@example 
		ajaxOptions: {
		    type: 'put',
		    dataType: 'json'
		}        
		**/
		ajaxOptions: null,
		/**
		Where to show buttons: left(true)|bottom|false  
		Form without buttons is auto-submitted.

		@property showbuttons 
		@type boolean|string
		@default true
		@since 1.1.1
		**/
		showbuttons: true,
		/**
		Scope for callback methods (success, validate).  
		If <code>null</code> means editableform instance itself. 

		@property scope 
		@type DOMElement|object
		@default null
		@since 1.2.0
		@private
		**/
		scope: null,
		/**
		Whether to save or cancel value when it was not changed but form was submitted

		@property savenochange 
		@type boolean
		@default false
		@since 1.2.0
		**/
		savenochange: false
	};

	/*
	Note: following params could redefined in engine: bootstrap or jqueryui:
	Classes 'control-group' and 'editable-error-block' must always present!
	*/
	$.fn.editableform.template = '<form class="form-inline editableform">' +
		'<div class="control-group">' +
		'<div><div class="editable-input"></div><div class="editable-buttons"></div></div>' +
		'<div class="editable-error-block"></div>' +
		'</div>' +
		'</form>';

	//loading div
	$.fn.editableform.loading = '<div class="editableform-loading"></div>';

	//buttons
	$.fn.editableform.buttons = '<button type="submit" class="editable-submit">ok</button>' +
		'<button type="button" class="editable-cancel">cancel</button>';

	//error class attached to control-group
	$.fn.editableform.errorGroupClass = null;

	//error class attached to editable-error-block
	$.fn.editableform.errorBlockClass = 'editable-error';

	//engine
	$.fn.editableform.engine = 'jquery';
}(window.jQuery));

/**
 * EditableForm utilites
 */
(function($) {
	"use strict";

	//utils
	$.fn.editableutils = {
		/**
		 * classic JS inheritance function
		 */
		inherit: function(Child, Parent) {
			var F = function() {};
			F.prototype = Parent.prototype;
			Child.prototype = new F();
			Child.prototype.constructor = Child;
			Child.superclass = Parent.prototype;
		},

		/**
		 * set caret position in input
		 * see http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
		 */
		setCursorPosition: function(elem, pos) {
			if (elem.setSelectionRange) {
				elem.setSelectionRange(pos, pos);
			} else if (elem.createTextRange) {
				var range = elem.createTextRange();
				range.collapse(true);
				range.moveEnd('character', pos);
				range.moveStart('character', pos);
				range.select();
			}
		},

		/**
		 * function to parse JSON in *single* quotes. (jquery automatically parse only double quotes)
		 * That allows such code as: <a data-source="{'a': 'b', 'c': 'd'}">
		 * safe = true --> means no exception will be thrown
		 * for details see http://stackoverflow.com/questions/7410348/how-to-set-json-format-to-html5-data-attributes-in-the-jquery
		 */
		tryParseJson: function(s, safe) {
			if (typeof s === 'string' && s.length && s.match(/^[\{\[].*[\}\]]$/)) {
				if (safe) {
					try {
						/*jslint evil: true*/
						s = (new Function('return ' + s))();
						/*jslint evil: false*/
					} catch (e) {} finally {
						return s;
					}
				} else {
					/*jslint evil: true*/
					s = (new Function('return ' + s))();
					/*jslint evil: false*/
				}
			}
			return s;
		},

		/**
		 * slice object by specified keys
		 */
		sliceObj: function(obj, keys, caseSensitive /* default: false */ ) {
			var key, keyLower, newObj = {};

			if (!$.isArray(keys) || !keys.length) {
				return newObj;
			}

			for (var i = 0; i < keys.length; i++) {
				key = keys[i];
				if (obj.hasOwnProperty(key)) {
					newObj[key] = obj[key];
				}

				if (caseSensitive === true) {
					continue;
				}

				//when getting data-* attributes via $.data() it's converted to lowercase.
				//details: http://stackoverflow.com/questions/7602565/using-data-attributes-with-jquery
				//workaround is code below.
				keyLower = key.toLowerCase();
				if (obj.hasOwnProperty(keyLower)) {
					newObj[key] = obj[keyLower];
				}
			}

			return newObj;
		},

		/*
		exclude complex objects from $.data() before pass to config
		*/
		getConfigData: function($element) {
			var data = {};
			$.each($element.data(), function(k, v) {
				if (typeof v !== 'object' || (v && typeof v === 'object' && (v.constructor === Object || v.constructor === Array))) {
					data[k] = v;
				}
			});
			return data;
		},

		/*
		 returns keys of object
		*/
		objectKeys: function(o) {
			if (Object.keys) {
				return Object.keys(o);
			} else {
				if (o !== Object(o)) {
					throw new TypeError('Object.keys called on a non-object');
				}
				var k = [],
					p;
				for (p in o) {
					if (Object.prototype.hasOwnProperty.call(o, p)) {
						k.push(p);
					}
				}
				return k;
			}

		},

		/**
		 method to escape html.
		**/
		escape: function(str) {
			return $('<div>').text(str).html();
		},

		/*
		 returns array items from sourceData having value property equal or inArray of 'value'
		*/
		itemsByValue: function(value, sourceData, valueProp) {
			if (!sourceData || value === null) {
				return [];
			}

			if (typeof(valueProp) !== "function") {
				var idKey = valueProp || 'value';
				valueProp = function(e) {
					return e[idKey];
				};
			}

			var isValArray = $.isArray(value),
				result = [],
				that = this;

			$.each(sourceData, function(i, o) {
				if (o.children) {
					result = result.concat(that.itemsByValue(value, o.children, valueProp));
				} else {
					/*jslint eqeq: true*/
					if (isValArray) {
						if ($.grep(value, function(v) {
								return v == (o && typeof o === 'object' ? valueProp(o) : o);
							}).length) {
							result.push(o);
						}
					} else {
						var itemValue = (o && (typeof o === 'object')) ? valueProp(o) : o;
						if (value == itemValue) {
							result.push(o);
						}
					}
					/*jslint eqeq: false*/
				}
			});

			return result;
		},

		/*
		Returns input by options: type, mode. 
		*/
		createInput: function(options) {
			var TypeConstructor, typeOptions, input,
				type = options.type;

			//`date` is some kind of virtual type that is transformed to one of exact types
			//depending on mode and core lib
			if (type === 'date') {
				//inline
				if (options.mode === 'inline') {
					if ($.fn.editabletypes.datefield) {
						type = 'datefield';
					} else if ($.fn.editabletypes.dateuifield) {
						type = 'dateuifield';
					}
					//popup
				} else {
					if ($.fn.editabletypes.date) {
						type = 'date';
					} else if ($.fn.editabletypes.dateui) {
						type = 'dateui';
					}
				}

				//if type still `date` and not exist in types, replace with `combodate` that is base input
				if (type === 'date' && !$.fn.editabletypes.date) {
					type = 'combodate';
				}
			}

			//`datetime` should be datetimefield in 'inline' mode
			if (type === 'datetime' && options.mode === 'inline') {
				type = 'datetimefield';
			}

			//change wysihtml5 to textarea for jquery UI and plain versions
			if (type === 'wysihtml5' && !$.fn.editabletypes[type]) {
				type = 'textarea';
			}

			//create input of specified type. Input will be used for converting value, not in form
			if (typeof $.fn.editabletypes[type] === 'function') {
				TypeConstructor = $.fn.editabletypes[type];
				typeOptions = this.sliceObj(options, this.objectKeys(TypeConstructor.defaults));
				input = new TypeConstructor(typeOptions);
				return input;
			} else {
				$.error('Unknown type: ' + type);
				return false;
			}
		},

		//see http://stackoverflow.com/questions/7264899/detect-css-transitions-using-javascript-and-without-modernizr
		supportsTransitions: function() {
			var b = document.body || document.documentElement,
				s = b.style,
				p = 'transition',
				v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'];

			if (typeof s[p] === 'string') {
				return true;
			}

			// Tests for vendor specific prop
			p = p.charAt(0).toUpperCase() + p.substr(1);
			for (var i = 0; i < v.length; i++) {
				if (typeof s[v[i] + p] === 'string') {
					return true;
				}
			}
			return false;
		}

	};
}(window.jQuery));

/**
Attaches stand-alone container with editable-form to HTML element. Element is used only for positioning, value is not stored anywhere.<br>
This method applied internally in <code>$().editable()</code>. You should subscribe on it's events (save / cancel) to get profit of it.<br>
Final realization can be different: bootstrap-popover, jqueryui-tooltip, poshytip, inline-div. It depends on which js file you include.<br>
Applied as jQuery method.

@class editableContainer
@uses editableform
**/
(function($) {
	"use strict";

	var Popup = function(element, options) {
		this.init(element, options);
	};

	var Inline = function(element, options) {
		this.init(element, options);
	};

	//methods
	Popup.prototype = {
		containerName: null, //method to call container on element
		containerDataName: null, //object name in element's .data()
		innerCss: null, //tbd in child class
		containerClass: 'editable-container editable-popup', //css class applied to container element
		defaults: {}, //container itself defaults

		init: function(element, options) {
			this.$element = $(element);
			//since 1.4.1 container do not use data-* directly as they already merged into options.
			this.options = $.extend({}, $.fn.editableContainer.defaults, options);
			this.splitOptions();

			//set scope of form callbacks to element
			this.formOptions.scope = this.$element[0];

			this.initContainer();

			//flag to hide container, when saving value will finish
			this.delayedHide = false;

			//bind 'destroyed' listener to destroy container when element is removed from dom
			this.$element.on('destroyed', $.proxy(function() {
				this.destroy();
			}, this));

			//attach document handler to close containers on click / escape
			if (!$(document).data('editable-handlers-attached')) {
				//close all on escape
				$(document).on('keyup.editable', function(e) {
					if (e.which === 27) {
						$('.editable-open').editableContainer('hide');
						//todo: return focus on element 
					}
				});

				//close containers when click outside 
				//(mousedown could be better than click, it closes everything also on drag drop)
				$(document).on('click.editable', function(e) {
					var $target = $(e.target),
						i,
						exclude_classes = ['.editable-container',
							'.ui-datepicker-header',
							'.datepicker', //in inline mode datepicker is rendered into body
							'.modal-backdrop',
							'.bootstrap-wysihtml5-insert-image-modal',
							'.bootstrap-wysihtml5-insert-link-modal'
						];

					//check if element is detached. It occurs when clicking in bootstrap datepicker
					if (!$.contains(document.documentElement, e.target)) {
						return;
					}

					//for some reason FF 20 generates extra event (click) in select2 widget with e.target = document
					//we need to filter it via construction below. See https://github.com/vitalets/x-editable/issues/199
					//Possibly related to http://stackoverflow.com/questions/10119793/why-does-firefox-react-differently-from-webkit-and-ie-to-click-event-on-selec
					if ($target.is(document)) {
						return;
					}

					//if click inside one of exclude classes --> no nothing
					for (i = 0; i < exclude_classes.length; i++) {
						if ($target.is(exclude_classes[i]) || $target.parents(exclude_classes[i]).length) {
							return;
						}
					}

					//close all open containers (except one - target)
					Popup.prototype.closeOthers(e.target);
				});

				$(document).data('editable-handlers-attached', true);
			}
		},

		//split options on containerOptions and formOptions
		splitOptions: function() {
			this.containerOptions = {};
			this.formOptions = {};

			if (!$.fn[this.containerName]) {
				throw new Error(this.containerName + ' not found. Have you included corresponding js file?');
			}

			//keys defined in container defaults go to container, others go to form
			for (var k in this.options) {
				if (k in this.defaults) {
					this.containerOptions[k] = this.options[k];
				} else {
					this.formOptions[k] = this.options[k];
				}
			}
		},

		/*
		Returns jquery object of container
		@method tip()
		*/
		tip: function() {
			return this.container() ? this.container().$tip : null;
		},

		/* returns container object */
		container: function() {
			var container;
			//first, try get it by `containerDataName`
			if (this.containerDataName) {
				if (container = this.$element.data(this.containerDataName)) {
					return container;
				}
			}
			//second, try `containerName`
			container = this.$element.data(this.containerName);
			return container;
		},

		/* call native method of underlying container, e.g. this.$element.popover('method') */
		call: function() {
			this.$element[this.containerName].apply(this.$element, arguments);
		},

		initContainer: function() {
			this.call(this.containerOptions);
		},

		renderForm: function() {
			this.$form
				.editableform(this.formOptions)
				.on({
					save: $.proxy(this.save, this), //click on submit button (value changed)
					nochange: $.proxy(function() {
						this.hide('nochange');
					}, this), //click on submit button (value NOT changed)                
					cancel: $.proxy(function() {
						this.hide('cancel');
					}, this), //click on calcel button
					show: $.proxy(function() {
						if (this.delayedHide) {
							this.hide(this.delayedHide.reason);
							this.delayedHide = false;
						} else {
							this.setPosition();
						}
					}, this), //re-position container every time form is shown (occurs each time after loading state)
					rendering: $.proxy(this.setPosition, this), //this allows to place container correctly when loading shown
					resize: $.proxy(this.setPosition, this), //this allows to re-position container when form size is changed 
					rendered: $.proxy(function() {
						/**        
						Fired when container is shown and form is rendered (for select will wait for loading dropdown options).  
						**Note:** Bootstrap popover has own `shown` event that now cannot be separated from x-editable's one.
						The workaround is to check `arguments.length` that is always `2` for x-editable.                     
                    
						@event shown 
						@param {Object} event event object
						@example
						$('#username').on('shown', function(e, editable) {
						    editable.input.$input.val('overwriting value of input..');
						});                     
						**/
						/*
						 TODO: added second param mainly to distinguish from bootstrap's shown event. It's a hotfix that will be solved in future versions via namespaced events.  
						*/
						this.$element.triggerHandler('shown', $(this.options.scope).data('editable'));
					}, this)
				})
				.editableform('render');
		},

		/**
		Shows container with form
		@method show()
		@param {boolean} closeAll Whether to close all other editable containers when showing this one. Default true.
		**/
		/* Note: poshytip owerwrites this method totally! */
		show: function(closeAll) {
			this.$element.addClass('editable-open');
			if (closeAll !== false) {
				//close all open containers (except this)
				this.closeOthers(this.$element[0]);
			}

			//show container itself
			this.innerShow();
			this.tip().addClass(this.containerClass);

			/*
			Currently, form is re-rendered on every show. 
			The main reason is that we dont know, what will container do with content when closed:
			remove(), detach() or just hide() - it depends on container.
            
			Detaching form itself before hide and re-insert before show is good solution, 
			but visually it looks ugly --> container changes size before hide.  
			*/

			//if form already exist - delete previous data 
			if (this.$form) {
				//todo: destroy prev data!
				//this.$form.destroy();
			}

			this.$form = $('<div>');

			//insert form into container body
			if (this.tip().is(this.innerCss)) {
				//for inline container
				this.tip().append(this.$form);
			} else {
				this.tip().find(this.innerCss).append(this.$form);
			}

			//render form
			this.renderForm();
		},

		/**
		Hides container with form
		@method hide()
		@param {string} reason Reason caused hiding. Can be <code>save|cancel|onblur|nochange|undefined (=manual)</code>
		**/
		hide: function(reason) {
			if (!this.tip() || !this.tip().is(':visible') || !this.$element.hasClass('editable-open')) {
				return;
			}

			//if form is saving value, schedule hide
			if (this.$form.data('editableform').isSaving) {
				this.delayedHide = {
					reason: reason
				};
				return;
			} else {
				this.delayedHide = false;
			}

			this.$element.removeClass('editable-open');
			this.innerHide();

			/**
			Fired when container was hidden. It occurs on both save or cancel.  
			**Note:** Bootstrap popover has own `hidden` event that now cannot be separated from x-editable's one.
			The workaround is to check `arguments.length` that is always `2` for x-editable. 

			@event hidden 
			@param {object} event event object
			@param {string} reason Reason caused hiding. Can be <code>save|cancel|onblur|nochange|manual</code>
			@example
			$('#username').on('hidden', function(e, reason) {
			    if(reason === 'save' || reason === 'cancel') {
			        //auto-open next editable
			        $(this).closest('tr').next().find('.editable').editable('show');
			    } 
			});
			**/
			this.$element.triggerHandler('hidden', reason || 'manual');
		},

		/* internal show method. To be overwritten in child classes */
		innerShow: function() {

		},

		/* internal hide method. To be overwritten in child classes */
		innerHide: function() {

		},

		/**
		Toggles container visibility (show / hide)
		@method toggle()
		@param {boolean} closeAll Whether to close all other editable containers when showing this one. Default true.
		**/
		toggle: function(closeAll) {
			if (this.container() && this.tip() && this.tip().is(':visible')) {
				this.hide();
			} else {
				this.show(closeAll);
			}
		},

		/*
		Updates the position of container when content changed.
		@method setPosition()
		*/
		setPosition: function() {
			//tbd in child class
		},

		save: function(e, params) {
			/**        
			Fired when new value was submitted. You can use <code>$(this).data('editableContainer')</code> inside handler to access to editableContainer instance
            
			@event save 
			@param {Object} event event object
			@param {Object} params additional params
			@param {mixed} params.newValue submitted value
			@param {Object} params.response ajax response
			@example
			$('#username').on('save', function(e, params) {
			    //assuming server response: '{success: true}'
			    var pk = $(this).data('editableContainer').options.pk;
			    if(params.response && params.response.success) {
			        alert('value: ' + params.newValue + ' with pk: ' + pk + ' saved!');
			    } else {
			        alert('error!'); 
			    } 
			});
			**/

			this.$element.triggerHandler('save', params);

			//hide must be after trigger, as saving value may require methods of plugin, applied to input
			this.hide('save');
		},

		/**
		Sets new option
        
		@method option(key, value)
		@param {string} key 
		@param {mixed} value 
		**/
		option: function(key, value) {
			this.options[key] = value;
			if (key in this.containerOptions) {
				this.containerOptions[key] = value;
				this.setContainerOption(key, value);
			} else {
				this.formOptions[key] = value;
				if (this.$form) {
					this.$form.editableform('option', key, value);
				}
			}
		},

		setContainerOption: function(key, value) {
			this.call('option', key, value);
		},

		/**
		Destroys the container instance
		@method destroy()
		**/
		destroy: function() {
			this.hide();
			this.innerDestroy();
			this.$element.off('destroyed');
			this.$element.removeData('editableContainer');
		},

		/* to be overwritten in child classes */
		innerDestroy: function() {

		},

		/*
		Closes other containers except one related to passed element. 
		Other containers can be cancelled or submitted (depends on onblur option)
		*/
		closeOthers: function(element) {
			$('.editable-open').each(function(i, el) {
				//do nothing with passed element and it's children
				if (el === element || $(el).find(element).length) {
					return;
				}

				//otherwise cancel or submit all open containers 
				var $el = $(el),
					ec = $el.data('editableContainer');

				if (!ec) {
					return;
				}

				if (ec.options.onblur === 'cancel') {
					$el.data('editableContainer').hide('onblur');
				} else if (ec.options.onblur === 'submit') {
					$el.data('editableContainer').tip().find('form').submit();
				}
			});

		},

		/**
		Activates input of visible container (e.g. set focus)
		@method activate()
		**/
		activate: function() {
			if (this.tip && this.tip().is(':visible') && this.$form) {
				this.$form.data('editableform').input.activate();
			}
		}

	};

	/**
	jQuery method to initialize editableContainer.
    
	@method $().editableContainer(options)
	@params {Object} options
	@example
	$('#edit').editableContainer({
	    type: 'text',
	    url: '/post',
	    pk: 1,
	    value: 'hello'
	});
	**/
	$.fn.editableContainer = function(option) {
		var args = arguments;
		return this.each(function() {
			var $this = $(this),
				dataKey = 'editableContainer',
				data = $this.data(dataKey),
				options = typeof option === 'object' && option,
				Constructor = (options.mode === 'inline') ? Inline : Popup;

			if (!data) {
				$this.data(dataKey, (data = new Constructor(this, options)));
			}

			if (typeof option === 'string') { //call method 
				data[option].apply(data, Array.prototype.slice.call(args, 1));
			}
		});
	};

	//store constructors
	$.fn.editableContainer.Popup = Popup;
	$.fn.editableContainer.Inline = Inline;

	//defaults
	$.fn.editableContainer.defaults = {
		/**
		Initial value of form input

		@property value 
		@type mixed
		@default null
		@private
		**/
		value: null,
		/**
		Placement of container relative to element. Can be <code>top|right|bottom|left</code>. Not used for inline container.

		@property placement 
		@type string
		@default 'top'
		**/
		placement: 'top',
		/**
		Whether to hide container on save/cancel.

		@property autohide 
		@type boolean
		@default true
		@private 
		**/
		autohide: true,
		/**
		Action when user clicks outside the container. Can be <code>cancel|submit|ignore</code>.  
		Setting <code>ignore</code> allows to have several containers open. 

		@property onblur 
		@type string
		@default 'cancel'
		@since 1.1.1
		**/
		onblur: 'cancel',

		/**
		Animation speed (inline mode only)
		@property anim 
		@type string
		@default false
		**/
		anim: false,

		/**
		Mode of editable, can be `popup` or `inline` 
        
		@property mode 
		@type string         
		@default 'popup'
		@since 1.4.0        
		**/
		mode: 'popup'
	};

	/* 
	 * workaround to have 'destroyed' event to destroy popover when element is destroyed
	 * see http://stackoverflow.com/questions/2200494/jquery-trigger-event-when-an-element-is-removed-from-the-dom
	 */
	jQuery.event.special.destroyed = {
		remove: function(o) {
			if (o.handler) {
				o.handler();
			}
		}
	};

}(window.jQuery));

/**
 * Editable Inline 
 * ---------------------
 */
(function($) {
	"use strict";

	//copy prototype from EditableContainer
	//extend methods
	$.extend($.fn.editableContainer.Inline.prototype, $.fn.editableContainer.Popup.prototype, {
		containerName: 'editableform',
		innerCss: '.editable-inline',
		containerClass: 'editable-container editable-inline', //css class applied to container element

		initContainer: function() {
			//container is <span> element
			this.$tip = $('<span></span>');

			//convert anim to miliseconds (int)
			if (!this.options.anim) {
				this.options.anim = 0;
			}
		},

		splitOptions: function() {
			//all options are passed to form
			this.containerOptions = {};
			this.formOptions = this.options;
		},

		tip: function() {
			return this.$tip;
		},

		innerShow: function() {
			this.$element.hide();
			this.tip().insertAfter(this.$element).show();
		},

		innerHide: function() {
			this.$tip.hide(this.options.anim, $.proxy(function() {
				this.$element.show();
				this.innerDestroy();
			}, this));
		},

		innerDestroy: function() {
			if (this.tip()) {
				this.tip().empty().remove();
			}
		}
	});

}(window.jQuery));
/**
Makes editable any HTML element on the page. Applied as jQuery method.

@class editable
@uses editableContainer
**/
(function($) {
	"use strict";

	var Editable = function(element, options) {
		this.$element = $(element);
		//data-* has more priority over js options: because dynamically created elements may change data-* 
		this.options = $.extend({}, $.fn.editable.defaults, options, $.fn.editableutils.getConfigData(this.$element));
		if (this.options.selector) {
			this.initLive();
		} else {
			this.init();
		}

		//check for transition support
		if (this.options.highlight && !$.fn.editableutils.supportsTransitions()) {
			this.options.highlight = false;
		}
	};

	Editable.prototype = {
		constructor: Editable,
		init: function() {
			var isValueByText = false,
				doAutotext, finalize;

			//name
			this.options.name = this.options.name || this.$element.attr('id');

			//create input of specified type. Input needed already here to convert value for initial display (e.g. show text by id for select)
			//also we set scope option to have access to element inside input specific callbacks (e. g. source as function)
			this.options.scope = this.$element[0];
			this.input = $.fn.editableutils.createInput(this.options);
			if (!this.input) {
				return;
			}

			//set value from settings or by element's text
			if (this.options.value === undefined || this.options.value === null) {
				this.value = this.input.html2value($.trim(this.$element.html()));
				isValueByText = true;
			} else {
				/*
				  value can be string when received from 'data-value' attribute
				  for complext objects value can be set as json string in data-value attribute, 
				  e.g. data-value="{city: 'Moscow', street: 'Lenina'}"
				*/
				this.options.value = $.fn.editableutils.tryParseJson(this.options.value, true);
				if (typeof this.options.value === 'string') {
					this.value = this.input.str2value(this.options.value);
				} else {
					this.value = this.options.value;
				}
			}

			//add 'editable' class to every editable element
			this.$element.addClass('editable');

			//specifically for "textarea" add class .editable-pre-wrapped to keep linebreaks
			if (this.input.type === 'textarea') {
				this.$element.addClass('editable-pre-wrapped');
			}

			//attach handler activating editable. In disabled mode it just prevent default action (useful for links)
			if (this.options.toggle !== 'manual') {
				this.$element.addClass('editable-click');
				this.$element.on(this.options.toggle + '.editable', $.proxy(function(e) {
					//prevent following link if editable enabled
					if (!this.options.disabled) {
						e.preventDefault();
					}

					//stop propagation not required because in document click handler it checks event target
					//e.stopPropagation();

					if (this.options.toggle === 'mouseenter') {
						//for hover only show container
						this.show();
					} else {
						//when toggle='click' we should not close all other containers as they will be closed automatically in document click listener
						var closeAll = (this.options.toggle !== 'click');
						this.toggle(closeAll);
					}
				}, this));
			} else {
				this.$element.attr('tabindex', -1); //do not stop focus on element when toggled manually
			}

			//if display is function it's far more convinient to have autotext = always to render correctly on init
			//see https://github.com/vitalets/x-editable-yii/issues/34
			if (typeof this.options.display === 'function') {
				this.options.autotext = 'always';
			}

			//check conditions for autotext:
			switch (this.options.autotext) {
				case 'always':
					doAutotext = true;
					break;
				case 'auto':
					//if element text is empty and value is defined and value not generated by text --> run autotext
					doAutotext = !$.trim(this.$element.text()).length && this.value !== null && this.value !== undefined && !isValueByText;
					break;
				default:
					doAutotext = false;
			}

			//depending on autotext run render() or just finilize init
			$.when(doAutotext ? this.render() : true).then($.proxy(function() {
				if (this.options.disabled) {
					this.disable();
				} else {
					this.enable();
				}
				/**        
				Fired when element was initialized by `$().editable()` method. 
				Please note that you should setup `init` handler **before** applying `editable`. 
				               
				@event init 
				@param {Object} event event object
				@param {Object} editable editable instance (as here it cannot accessed via data('editable'))
				@since 1.2.0
				@example
				$('#username').on('init', function(e, editable) {
				    alert('initialized ' + editable.options.name);
				});
				$('#username').editable();
				**/
				this.$element.triggerHandler('init', this);
			}, this));
		},

		/*
		 Initializes parent element for live editables 
		*/
		initLive: function() {
			//store selector 
			var selector = this.options.selector;
			//modify options for child elements
			this.options.selector = false;
			this.options.autotext = 'never';
			//listen toggle events
			this.$element.on(this.options.toggle + '.editable', selector, $.proxy(function(e) {
				var $target = $(e.target);
				if (!$target.data('editable')) {
					//if delegated element initially empty, we need to clear it's text (that was manually set to `empty` by user)
					//see https://github.com/vitalets/x-editable/issues/137 
					if ($target.hasClass(this.options.emptyclass)) {
						$target.empty();
					}
					$target.editable(this.options).trigger(e);
				}
			}, this));
		},

		/*
		Renders value into element's text.
		Can call custom display method from options.
		Can return deferred object.
		@method render()
		@param {mixed} response server response (if exist) to pass into display function
		*/
		render: function(response) {
			//do not display anything
			if (this.options.display === false) {
				return;
			}

			//if input has `value2htmlFinal` method, we pass callback in third param to be called when source is loaded
			if (this.input.value2htmlFinal) {
				return this.input.value2html(this.value, this.$element[0], this.options.display, response);
				//if display method defined --> use it    
			} else if (typeof this.options.display === 'function') {
				return this.options.display.call(this.$element[0], this.value, response);
				//else use input's original value2html() method    
			} else {
				return this.input.value2html(this.value, this.$element[0]);
			}
		},

		/**
		Enables editable
		@method enable()
		**/
		enable: function() {
			this.options.disabled = false;
			this.$element.removeClass('editable-disabled');
			this.handleEmpty(this.isEmpty);
			if (this.options.toggle !== 'manual') {
				if (this.$element.attr('tabindex') === '-1') {
					this.$element.removeAttr('tabindex');
				}
			}
		},

		/**
		Disables editable
		@method disable()
		**/
		disable: function() {
			this.options.disabled = true;
			this.hide();
			this.$element.addClass('editable-disabled');
			this.handleEmpty(this.isEmpty);
			//do not stop focus on this element
			this.$element.attr('tabindex', -1);
		},

		/**
		Toggles enabled / disabled state of editable element
		@method toggleDisabled()
		**/
		toggleDisabled: function() {
			if (this.options.disabled) {
				this.enable();
			} else {
				this.disable();
			}
		},

		/**
		Sets new option
        
		@method option(key, value)
		@param {string|object} key option name or object with several options
		@param {mixed} value option new value
		@example
		$('.editable').editable('option', 'pk', 2);
		**/
		option: function(key, value) {
			//set option(s) by object
			if (key && typeof key === 'object') {
				$.each(key, $.proxy(function(k, v) {
					this.option($.trim(k), v);
				}, this));
				return;
			}

			//set option by string             
			this.options[key] = value;

			//disabled
			if (key === 'disabled') {
				return value ? this.disable() : this.enable();
			}

			//value
			if (key === 'value') {
				this.setValue(value);
			}

			//transfer new option to container! 
			if (this.container) {
				this.container.option(key, value);
			}

			//pass option to input directly (as it points to the same in form)
			if (this.input.option) {
				this.input.option(key, value);
			}

		},

		/*
		 * set emptytext if element is empty
		 */
		handleEmpty: function(isEmpty) {
			//do not handle empty if we do not display anything
			if (this.options.display === false) {
				return;
			}

			/* 
			isEmpty may be set directly as param of method.
			It is required when we enable/disable field and can't rely on content 
			as node content is text: "Empty" that is not empty %)
			*/
			if (isEmpty !== undefined) {
				this.isEmpty = isEmpty;
			} else {
				//detect empty
				//for some inputs we need more smart check
				//e.g. wysihtml5 may have <br>, <p></p>, <img>
				if (typeof(this.input.isEmpty) === 'function') {
					this.isEmpty = this.input.isEmpty(this.$element);
				} else {
					this.isEmpty = $.trim(this.$element.html()) === '';
				}
			}

			//emptytext shown only for enabled
			if (!this.options.disabled) {
				if (this.isEmpty) {
					this.$element.html(this.options.emptytext);
					if (this.options.emptyclass) {
						this.$element.addClass(this.options.emptyclass);
					}
				} else if (this.options.emptyclass) {
					this.$element.removeClass(this.options.emptyclass);
				}
			} else {
				//below required if element disable property was changed
				if (this.isEmpty) {
					this.$element.empty();
					if (this.options.emptyclass) {
						this.$element.removeClass(this.options.emptyclass);
					}
				}
			}
		},

		/**
		Shows container with form
		@method show()
		@param {boolean} closeAll Whether to close all other editable containers when showing this one. Default true.
		**/
		show: function(closeAll) {
			if (this.options.disabled) {
				return;
			}

			//init editableContainer: popover, tooltip, inline, etc..
			if (!this.container) {
				var containerOptions = $.extend({}, this.options, {
					value: this.value,
					input: this.input //pass input to form (as it is already created)
				});
				this.$element.editableContainer(containerOptions);
				//listen `save` event 
				this.$element.on("save.internal", $.proxy(this.save, this));
				this.container = this.$element.data('editableContainer');
			} else if (this.container.tip().is(':visible')) {
				return;
			}

			//show container
			this.container.show(closeAll);
		},

		/**
		Hides container with form
		@method hide()
		**/
		hide: function() {
			if (this.container) {
				this.container.hide();
			}
		},

		/**
		Toggles container visibility (show / hide)
		@method toggle()
		@param {boolean} closeAll Whether to close all other editable containers when showing this one. Default true.
		**/
		toggle: function(closeAll) {
			if (this.container && this.container.tip().is(':visible')) {
				this.hide();
			} else {
				this.show(closeAll);
			}
		},

		/*
		 * called when form was submitted
		 */
		save: function(e, params) {
			if ($(e.target).hasClass('checktype-error')) {
				$(e.target).removeClass('checktype-error');
				return false;
			}
			//mark element with unsaved class if needed
			if (this.options.unsavedclass) {
				/*
				 Add unsaved css to element if:
				  - url is not user's function 
				  - value was not sent to server
				  - params.response === undefined, that means data was not sent
				  - value changed 
				*/
				var sent = false;
				sent = sent || typeof this.options.url === 'function';
				sent = sent || this.options.display === false;
				sent = sent || params.response !== undefined;
				sent = sent || (this.options.savenochange && this.input.value2str(this.value) !== this.input.value2str(params.newValue));

				if (sent) {
					this.$element.removeClass(this.options.unsavedclass);
				} else {
					this.$element.addClass(this.options.unsavedclass);
				}
			}

			//highlight when saving
			if (this.options.highlight) {
				var $e = this.$element,
					bgColor = $e.css('background-color');

				$e.css('background-color', this.options.highlight);
				setTimeout(function() {
					if (bgColor === 'transparent') {
						bgColor = '';
					}
					$e.css('background-color', bgColor);
					$e.addClass('editable-bg-transition');
					setTimeout(function() {
						$e.removeClass('editable-bg-transition');
					}, 1700);
				}, 10);
			}
			//set new value
			this.setValue(params.newValue, false, params.response);

			/**        
			Fired when new value was submitted. You can use <code>$(this).data('editable')</code> to access to editable instance
            
			@event save 
			@param {Object} event event object
			@param {Object} params additional params
			@param {mixed} params.newValue submitted value
			@param {Object} params.response ajax response
			@example
			$('#username').on('save', function(e, params) {
			    alert('Saved value: ' + params.newValue);
			});
			**/
			//event itself is triggered by editableContainer. Description here is only for documentation              
		},

		validate: function() {
			if (typeof this.options.validate === 'function') {
				return this.options.validate.call(this, this.value);
			}
		},

		/**
		Sets new value of editable
		@method setValue(value, convertStr)
		@param {mixed} value new value 
		@param {boolean} convertStr whether to convert value from string to internal format
		**/
		setValue: function(value, convertStr, response) {
			if (convertStr) {
				this.value = this.input.str2value(value);
			} else {
				this.value = value;
			}
			if (this.container) {
				this.container.option('value', this.value);
			}
			$.when(this.render(response))
				.then($.proxy(function() {
					this.handleEmpty();
				}, this));
		},

		/**
		Activates input of visible container (e.g. set focus)
		@method activate()
		**/
		activate: function() {
			if (this.container) {
				this.container.activate();
			}
		},

		/**
		Removes editable feature from element
		@method destroy()
		**/
		destroy: function() {
			this.disable();

			if (this.container) {
				this.container.destroy();
			}

			this.input.destroy();

			if (this.options.toggle !== 'manual') {
				this.$element.removeClass('editable-click');
				this.$element.off(this.options.toggle + '.editable');
			}

			this.$element.off("save.internal");

			this.$element.removeClass('editable editable-open editable-disabled');
			this.$element.removeData('editable');
		}
	};

	/* EDITABLE PLUGIN DEFINITION
	 * ======================= */

	/**
	jQuery method to initialize editable element.
    
	@method $().editable(options)
	@params {Object} options
	@example
	$('#username').editable({
	    type: 'text',
	    url: '/post',
	    pk: 1
	});
	**/
	$.fn.editable = function(option) {
		//special API methods returning non-jquery object
		var result = {},
			args = arguments,
			datakey = 'editable';
		switch (option) {
			/**
			Runs client-side validation for all matched editables
            
			@method validate()
			@returns {Object} validation errors map
			@example
			$('#username, #fullname').editable('validate');
			// possible result:
			{
			  username: "username is required",
			  fullname: "fullname should be minimum 3 letters length"
			}
			**/
			case 'validate':
				this.each(function() {
					var $this = $(this),
						data = $this.data(datakey),
						error;
					if (data && (error = data.validate())) {
						result[data.options.name] = error;
					}
				});
				return result;

				/**
				Returns current values of editable elements.   
				Note that it returns an **object** with name-value pairs, not a value itself. It allows to get data from several elements.    
				If value of some editable is `null` or `undefined` it is excluded from result object.
				When param `isSingle` is set to **true** - it is supposed you have single element and will return value of editable instead of object.   
				 
				@method getValue()
				@param {bool} isSingle whether to return just value of single element
				@returns {Object} object of element names and values
				@example
				$('#username, #fullname').editable('getValue');
				//result:
				{
				username: "superuser",
				fullname: "John"
				}
				//isSingle = true
				$('#username').editable('getValue', true);
				//result "superuser" 
				**/
			case 'getValue':
				if (arguments.length === 2 && arguments[1] === true) { //isSingle = true
					result = this.eq(0).data(datakey).value;
				} else {
					this.each(function() {
						var $this = $(this),
							data = $this.data(datakey);
						if (data && data.value !== undefined && data.value !== null) {
							result[data.options.name] = data.input.value2submit(data.value);
						}
					});
				}
				return result;

				/**
				This method collects values from several editable elements and submit them all to server.   
				Internally it runs client-side validation for all fields and submits only in case of success.  
				See <a href="#newrecord">creating new records</a> for details.  
				Since 1.5.1 `submit` can be applied to single element to send data programmatically. In that case
				`url`, `success` and `error` is taken from initial options and you can just call `$('#username').editable('submit')`. 
            
				@method submit(options)
				@param {object} options 
				@param {object} options.url url to submit data 
				@param {object} options.data additional data to submit
				@param {object} options.ajaxOptions additional ajax options
				@param {function} options.error(obj) error handler 
				@param {function} options.success(obj,config) success handler
				@returns {Object} jQuery object
				**/
			case 'submit': //collects value, validate and submit to server for creating new record
				var config = arguments[1] || {},
					$elems = this,
					errors = this.editable('validate');

				// validation ok
				if ($.isEmptyObject(errors)) {
					var ajaxOptions = {};

					// for single element use url, success etc from options
					if ($elems.length === 1) {
						var editable = $elems.data('editable');
						//standard params
						var params = {
							name: editable.options.name || '',
							value: editable.input.value2submit(editable.value),
							pk: (typeof editable.options.pk === 'function') ?
								editable.options.pk.call(editable.options.scope) : editable.options.pk
						};

						//additional params
						if (typeof editable.options.params === 'function') {
							params = editable.options.params.call(editable.options.scope, params);
						} else {
							//try parse json in single quotes (from data-params attribute)
							editable.options.params = $.fn.editableutils.tryParseJson(editable.options.params, true);
							$.extend(params, editable.options.params);
						}

						ajaxOptions = {
							url: editable.options.url,
							data: params,
							type: 'POST'
						};

						// use success / error from options 
						config.success = config.success || editable.options.success;
						config.error = config.error || editable.options.error;

						// multiple elements
					} else {
						var values = this.editable('getValue');

						ajaxOptions = {
							url: config.url,
							data: values,
							type: 'POST'
						};
					}

					// ajax success callabck (response 200 OK)
					ajaxOptions.success = typeof config.success === 'function' ? function(response) {
						config.success.call($elems, response, config);
					} : $.noop;

					// ajax error callabck
					ajaxOptions.error = typeof config.error === 'function' ? function() {
						config.error.apply($elems, arguments);
					} : $.noop;

					// extend ajaxOptions    
					if (config.ajaxOptions) {
						$.extend(ajaxOptions, config.ajaxOptions);
					}

					// extra data 
					if (config.data) {
						$.extend(ajaxOptions.data, config.data);
					}

					// perform ajax request
					$.ajax(ajaxOptions);
				} else { //client-side validation error
					if (typeof config.error === 'function') {
						config.error.call($elems, errors);
					}
				}
				return this;
		}

		//return jquery object
		return this.each(function() {
			var $this = $(this),
				data = $this.data(datakey),
				options = typeof option === 'object' && option;

			//for delegated targets do not store `editable` object for element
			//it's allows several different selectors.
			//see: https://github.com/vitalets/x-editable/issues/312    
			if (options && options.selector) {
				data = new Editable(this, options);
				return;
			}

			if (!data) {
				$this.data(datakey, (data = new Editable(this, options)));
			}

			if (typeof option === 'string') { //call method 
				data[option].apply(data, Array.prototype.slice.call(args, 1));
			}
		});
	};

	$.fn.editable.defaults = {
		/**
		Type of input. Can be <code>text|textarea|select|date|checklist</code> and more

		@property type 
		@type string
		@default 'text'
		**/
		type: 'text',
		/**
		Sets disabled state of editable

		@property disabled 
		@type boolean
		@default false
		**/
		disabled: false,
		/**
		How to toggle editable. Can be <code>click|dblclick|mouseenter|manual</code>.   
		When set to <code>manual</code> you should manually call <code>show/hide</code> methods of editable.    
		**Note**: if you call <code>show</code> or <code>toggle</code> inside **click** handler of some DOM element, 
		you need to apply <code>e.stopPropagation()</code> because containers are being closed on any click on document.
        
		@example
		$('#edit-button').click(function(e) {
		    e.stopPropagation();
		    $('#username').editable('toggle');
		});

		@property toggle 
		@type string
		@default 'click'
		**/
		toggle: 'click',
		/**
		Text shown when element is empty.

		@property emptytext 
		@type string
		@default 'Empty'
		**/
		emptytext: 'Empty',
		/**
		Allows to automatically set element's text based on it's value. Can be <code>auto|always|never</code>. Useful for select and date.
		For example, if dropdown list is <code>{1: 'a', 2: 'b'}</code> and element's value set to <code>1</code>, it's html will be automatically set to <code>'a'</code>.  
		<code>auto</code> - text will be automatically set only if element is empty.  
		<code>always|never</code> - always(never) try to set element's text.

		@property autotext 
		@type string
		@default 'auto'
		**/
		autotext: 'auto',
		/**
		Initial value of input. If not set, taken from element's text.  
		Note, that if element's text is empty - text is automatically generated from value and can be customized (see `autotext` option).  
		For example, to display currency sign:
		@example
		<a id="price" data-type="text" data-value="100"></a>
		<script>
		$('#price').editable({
		    ...
		    display: function(value) {
		      $(this).text(value + '$');
		    } 
		}) 
		</script>
		        
		@property value 
		@type mixed
		@default element's text
		**/
		value: null,
		/**
		Callback to perform custom displaying of value in element's text.  
		If `null`, default input's display used.  
		If `false`, no displaying methods will be called, element's text will never change.  
		Runs under element's scope.  
		_**Parameters:**_  
        
		* `value` current value to be displayed
		* `response` server response (if display called after ajax submit), since 1.4.0
		 
		For _inputs with source_ (select, checklist) parameters are different:  
		  
		* `value` current value to be displayed
		* `sourceData` array of items for current input (e.g. dropdown items) 
		* `response` server response (if display called after ajax submit), since 1.4.0
		          
		To get currently selected items use `$.fn.editableutils.itemsByValue(value, sourceData)`.
        
		@property display 
		@type function|boolean
		@default null
		@since 1.2.0
		@example
		display: function(value, sourceData) {
		   //display checklist as comma-separated values
		   var html = [],
		       checked = $.fn.editableutils.itemsByValue(value, sourceData);
		       
		   if(checked.length) {
		       $.each(checked, function(i, v) { html.push($.fn.editableutils.escape(v.text)); });
		       $(this).html(html.join(', '));
		   } else {
		       $(this).empty(); 
		   }
		}
		**/
		display: null,
		/**
		Css class applied when editable text is empty.

		@property emptyclass 
		@type string
		@since 1.4.1        
		@default editable-empty
		**/
		emptyclass: 'editable-empty',
		/**
		Css class applied when value was stored but not sent to server (`pk` is empty or `send = 'never'`).  
		You may set it to `null` if you work with editables locally and submit them together.  

		@property unsavedclass 
		@type string
		@since 1.4.1        
		@default editable-unsaved
		**/
		unsavedclass: 'editable-unsaved',
		/**
		If selector is provided, editable will be delegated to the specified targets.  
		Usefull for dynamically generated DOM elements.  
		**Please note**, that delegated targets can't be initialized with `emptytext` and `autotext` options, 
		as they actually become editable only after first click.  
		You should manually set class `editable-click` to these elements.  
		Also, if element originally empty you should add class `editable-empty`, set `data-value=""` and write emptytext into element:

		@property selector 
		@type string
		@since 1.4.1        
		@default null
		@example
		<div id="user">
		  <!-- empty -->
		  <a href="#" data-name="username" data-type="text" class="editable-click editable-empty" data-value="" title="Username">Empty</a>
		  <!-- non-empty -->
		  <a href="#" data-name="group" data-type="select" data-source="/groups" data-value="1" class="editable-click" title="Group">Operator</a>
		</div>     
        
		<script>
		$('#user').editable({
		    selector: 'a',
		    url: '/post',
		    pk: 1
		});
		</script>
		**/
		selector: null,
		/**
		Color used to highlight element after update. Implemented via CSS3 transition, works in modern browsers.
        
		@property highlight 
		@type string|boolean
		@since 1.4.5        
		@default #FFFF80 
		**/
		highlight: '#FFFF80'
	};

}(window.jQuery));

/**
AbstractInput - base class for all editable inputs.
It defines interface to be implemented by any input type.
To create your own input you can inherit from this class.

@class abstractinput
**/
(function($) {
	"use strict";

	//types
	$.fn.editabletypes = {};

	var AbstractInput = function() {};

	AbstractInput.prototype = {
		/**
		 Initializes input

		 @method init() 
		 **/
		init: function(type, options, defaults) {
			this.type = type;
			this.options = $.extend({}, defaults, options);
		},

		/*
		this method called before render to init $tpl that is inserted in DOM
		*/
		prerender: function() {
			this.$tpl = $(this.options.tpl); //whole tpl as jquery object    
			this.$input = this.$tpl; //control itself, can be changed in render method
			this.$clear = null; //clear button
			this.error = null; //error message, if input cannot be rendered           
		},

		/**
		 Renders input from tpl. Can return jQuery deferred object.
		 Can be overwritten in child objects

		 @method render()
		**/
		render: function() {

		},

		/**
		 Sets element's html by value. 

		 @method value2html(value, element)
		 @param {mixed} value
		 @param {DOMElement} element
		**/
		value2html: function(value, element) {
			$(element)[this.options.escape ? 'text' : 'html']($.trim(value));
		},

		/**
		 Converts element's html to value

		 @method html2value(html)
		 @param {string} html
		 @returns {mixed}
		**/
		html2value: function(html) {
			return $('<div>').html(html).text();
		},

		/**
		 Converts value to string (for internal compare). For submitting to server used value2submit().

		 @method value2str(value) 
		 @param {mixed} value
		 @returns {string}
		**/
		value2str: function(value) {
			return value;
		},

		/**
		 Converts string received from server into value. Usually from `data-value` attribute.

		 @method str2value(str)
		 @param {string} str
		 @returns {mixed}
		**/
		str2value: function(str) {
			return str;
		},

		/**
		 Converts value for submitting to server. Result can be string or object.

		 @method value2submit(value) 
		 @param {mixed} value
		 @returns {mixed}
		**/
		value2submit: function(value) {
			return value;
		},

		/**
		 Sets value of input.

		 @method value2input(value) 
		 @param {mixed} value
		**/
		value2input: function(value) {
			this.$input.val(value);
		},

		/**
		 Returns value of input. Value can be object (e.g. datepicker)

		 @method input2value() 
		**/
		input2value: function() {
			return this.$input.val();
		},

		/**
		 Activates input. For text it sets focus.

		 @method activate() 
		**/
		activate: function() {
			if (this.$input.is(':visible')) {
				this.$input.focus();
			}
		},

		/**
		 Creates input.

		 @method clear() 
		**/
		clear: function() {
			this.$input.val(null);
		},

		/**
		 method to escape html.
		**/
		escape: function(str) {
			return $('<div>').text(str).html();
		},

		/**
		 attach handler to automatically submit form when value changed (useful when buttons not shown)
		**/
		autosubmit: function() {

		},

		/**
		Additional actions when destroying element 
		**/
		destroy: function() {},

		// -------- helper functions --------
		setClass: function() {
			if (this.options.inputclass) {
				this.$input.addClass(this.options.inputclass);
			}
		},

		setAttr: function(attr) {
			if (this.options[attr] !== undefined && this.options[attr] !== null) {
				this.$input.attr(attr, this.options[attr]);
			}
		},

		option: function(key, value) {
			this.options[key] = value;
		}

	};

	AbstractInput.defaults = {
		/**
		HTML template of input. Normally you should not change it.

		@property tpl 
		@type string
		@default ''
		**/
		tpl: '',
		/**
		CSS class automatically applied to input
        
		@property inputclass 
		@type string
		@default null
		**/
		inputclass: null,

		/**
		If `true` - html will be escaped in content of element via $.text() method.  
		If `false` - html will not be escaped, $.html() used.  
		When you use own `display` function, this option obviosly has no effect.
        
		@property escape 
		@type boolean
		@since 1.5.0
		@default true
		**/
		escape: true,

		//scope for external methods (e.g. source defined as function)
		//for internal use only
		scope: null,

		//need to re-declare showbuttons here to get it's value from common config (passed only options existing in defaults)
		showbuttons: true
	};

	$.extend($.fn.editabletypes, {
		abstractinput: AbstractInput
	});

}(window.jQuery));

/**
List - abstract class for inputs that have source option loaded from js array or via ajax

@class list
@extends abstractinput
**/
(function($) {
	"use strict";

	var List = function(options) {

	};

	$.fn.editableutils.inherit(List, $.fn.editabletypes.abstractinput);

	$.extend(List.prototype, {
		render: function() {
			var deferred = $.Deferred();

			this.error = null;
			this.onSourceReady(function() {
				this.renderList();
				deferred.resolve();
			}, function() {
				this.error = this.options.sourceError;
				deferred.resolve();
			});

			return deferred.promise();
		},

		html2value: function(html) {
			return null; //can't set value by text
		},

		value2html: function(value, element, display, response) {
			var deferred = $.Deferred();
			success = deferred.then(function() {
				if (typeof display === 'function') {
					//custom display method
					display.call(element, value, this.sourceData, response);
				} else {
					this.value2htmlFinal(value, element);
				}
				deferred.resolve();
			});

			//for null value just call success without loading source
			if (value === null) {
				success.call(this);
			} else {
				this.onSourceReady(success, function() {
					deferred.resolve();
				});
			}

			return deferred.promise();
		},

		// ------------- additional functions ------------

		onSourceReady: function(success, error) {
			//run source if it function
			var source;
			if ($.isFunction(this.options.source)) {
				source = this.options.source.call(this.options.scope);
				this.sourceData = null;
				//note: if function returns the same source as URL - sourceData will be taken from cahce and no extra request performed
			} else {
				source = this.options.source;
			}

			//if allready loaded just call success
			if (this.options.sourceCache && $.isArray(this.sourceData)) {
				success.call(this);
				return;
			}

			//try parse json in single quotes (for double quotes jquery does automatically)
			try {
				source = $.fn.editableutils.tryParseJson(source, false);
			} catch (e) {
				error.call(this);
				return;
			}

			//loading from url
			if (typeof source === 'string') {
				//try to get sourceData from cache
				if (this.options.sourceCache) {
					var cacheID = source,
						cache;

					if (!$(document).data(cacheID)) {
						$(document).data(cacheID, {});
					}
					cache = $(document).data(cacheID);

					//check for cached data
					if (cache.loading === false && cache.sourceData) { //take source from cache
						this.sourceData = cache.sourceData;
						this.doPrepend();
						success.call(this);
						return;
					} else if (cache.loading === true) { //cache is loading, put callback in stack to be called later
						cache.callbacks.push($.proxy(function() {
							this.sourceData = cache.sourceData;
							this.doPrepend();
							success.call(this);
						}, this));

						//also collecting error callbacks
						cache.err_callbacks.push($.proxy(error, this));
						return;
					} else { //no cache yet, activate it
						cache.loading = true;
						cache.callbacks = [];
						cache.err_callbacks = [];
					}
				}

				//ajaxOptions for source. Can be overwritten bt options.sourceOptions
				var ajaxOptions = $.extend({
					url: source,
					type: 'get',
					cache: false,
					dataType: 'json',
					success: $.proxy(function(data) {
						if (cache) {
							cache.loading = false;
						}
						this.sourceData = this.makeArray(data);
						if ($.isArray(this.sourceData)) {
							if (cache) {
								//store result in cache
								cache.sourceData = this.sourceData;
								//run success callbacks for other fields waiting for this source
								$.each(cache.callbacks, function() {
									this.call();
								});
							}
							this.doPrepend();
							success.call(this);
						} else {
							error.call(this);
							if (cache) {
								//run error callbacks for other fields waiting for this source
								$.each(cache.err_callbacks, function() {
									this.call();
								});
							}
						}
					}, this),
					error: $.proxy(function() {
						error.call(this);
						if (cache) {
							cache.loading = false;
							//run error callbacks for other fields
							$.each(cache.err_callbacks, function() {
								this.call();
							});
						}
					}, this)
				}, this.options.sourceOptions);

				//loading sourceData from server
				$.ajax(ajaxOptions);

			} else { //options as json/array
				this.sourceData = this.makeArray(source);

				if ($.isArray(this.sourceData)) {
					this.doPrepend();
					success.call(this);
				} else {
					error.call(this);
				}
			}
		},

		doPrepend: function() {
			if (this.options.prepend === null || this.options.prepend === undefined) {
				return;
			}

			if (!$.isArray(this.prependData)) {
				//run prepend if it is function (once)
				if ($.isFunction(this.options.prepend)) {
					this.options.prepend = this.options.prepend.call(this.options.scope);
				}

				//try parse json in single quotes
				this.options.prepend = $.fn.editableutils.tryParseJson(this.options.prepend, true);

				//convert prepend from string to object
				if (typeof this.options.prepend === 'string') {
					this.options.prepend = {
						'': this.options.prepend
					};
				}

				this.prependData = this.makeArray(this.options.prepend);
			}

			if ($.isArray(this.prependData) && $.isArray(this.sourceData)) {
				this.sourceData = this.prependData.concat(this.sourceData);
			}
		},

		/*
		 renders input list
		*/
		renderList: function() {
			// this method should be overwritten in child class
		},

		/*
         set element's html by value
        */
		value2htmlFinal: function(value, element) {
			// this method should be overwritten in child class
		},

		/**
		 * convert data to array suitable for sourceData, e.g. [{value: 1, text: 'abc'}, {...}]
		 */
		makeArray: function(data) {
			var count, obj, result = [],
				item, iterateItem;
			if (!data || typeof data === 'string') {
				return null;
			}

			if ($.isArray(data)) { //array
				/* 
				   function to iterate inside item of array if item is object.
				   Caclulates count of keys in item and store in obj. 
				*/
				iterateItem = function(k, v) {
					obj = {
						value: k,
						text: v
					};
					if (count++ >= 2) {
						return false; // exit from `each` if item has more than one key.
					}
				};

				for (var i = 0; i < data.length; i++) {
					item = data[i];
					if (typeof item === 'object') {
						count = 0; //count of keys inside item
						$.each(item, iterateItem);
						//case: [{val1: 'text1'}, {val2: 'text2} ...]
						if (count === 1) {
							result.push(obj);
							//case: [{value: 1, text: 'text1'}, {value: 2, text: 'text2'}, ...]
						} else if (count > 1) {
							//removed check of existance: item.hasOwnProperty('value') && item.hasOwnProperty('text')
							if (item.children) {
								item.children = this.makeArray(item.children);
							}
							result.push(item);
						}
					} else {
						//case: ['text1', 'text2' ...]
						result.push({
							value: item,
							text: item
						});
					}
				}
			} else { //case: {val1: 'text1', val2: 'text2, ...}
				$.each(data, function(k, v) {
					result.push({
						value: k,
						text: v
					});
				});
			}
			return result;
		},

		option: function(key, value) {
			this.options[key] = value;
			if (key === 'source') {
				this.sourceData = null;
			}
			if (key === 'prepend') {
				this.prependData = null;
			}
		}

	});

	List.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
		/**
        Source data for list.  
        If **array** - it should be in format: `[{value: 1, text: "text1"}, {value: 2, text: "text2"}, ...]`  
        For compability, object format is also supported: `{"1": "text1", "2": "text2" ...}` but it does not guarantee elements order.
        
        If **string** - considered ajax url to load items. In that case results will be cached for fields with the same source and name. See also `sourceCache` option.
          
        If **function**, it should return data in format above (since 1.4.0).
        
        Since 1.4.1 key `children` supported to render OPTGROUP (for **select** input only).  
        `[{text: "group1", children: [{value: 1, text: "text1"}, {value: 2, text: "text2"}]}, ...]` 

		
        @property source 
        @type string | array | object | function
        @default null
        **/
		source: null,
		/**
		Data automatically prepended to the beginning of dropdown list.
        
		@property prepend 
		@type string | array | object | function
		@default false
		**/
		prepend: false,
		/**
		Error message when list cannot be loaded (e.g. ajax error)
        
		@property sourceError 
		@type string
		@default Error when loading list
		**/
		sourceError: 'Error when loading list',
		/**
		if <code>true</code> and source is **string url** - results will be cached for fields with the same source.    
		Usefull for editable column in grid to prevent extra requests.
        
		@property sourceCache 
		@type boolean
		@default true
		@since 1.2.0
		**/
		sourceCache: true,
		/**
		Additional ajax options to be used in $.ajax() when loading list from server.
		Useful to send extra parameters (`data` key) or change request method (`type` key).
        
		@property sourceOptions 
		@type object|function
		@default null
		@since 1.5.0
		**/
		sourceOptions: null
	});

	$.fn.editabletypes.list = List;

}(window.jQuery));

/**
Text input

@class text
@extends abstractinput
@final
@example
<a href="#" id="username" data-type="text" data-pk="1">awesome</a>
<script>
$(function(){
    $('#username').editable({
        url: '/post',
        title: 'Enter username'
    });
});
</script>
**/
(function($) {
	"use strict";

	var Text = function(options) {
		this.init('text', options, Text.defaults);
	};

	$.fn.editableutils.inherit(Text, $.fn.editabletypes.abstractinput);

	$.extend(Text.prototype, {
		render: function() {
			this.renderClear();
			this.setClass();
			this.setAttr('placeholder');
		},

		activate: function() {
			if (this.$input.is(':visible')) {
				this.$input.focus();
				$.fn.editableutils.setCursorPosition(this.$input.get(0), this.$input.val().length);
				if (this.toggleClear) {
					this.toggleClear();
				}
			}
		},

		//render clear button
		renderClear: function() {
			if (this.options.clear) {
				this.$clear = $('<span class="editable-clear-x"></span>');
				this.$input.after(this.$clear)
					.css('padding-right', 24)
					.keyup($.proxy(function(e) {
						//arrows, enter, tab, etc
						if (~$.inArray(e.keyCode, [40, 38, 9, 13, 27])) {
							return;
						}

						clearTimeout(this.t);
						var that = this;
						this.t = setTimeout(function() {
							that.toggleClear(e);
						}, 100);

					}, this))
					.parent().css('position', 'relative');

				this.$clear.click($.proxy(this.clear, this));
			}
		},

		postrender: function() {
			/*
            //now `clear` is positioned via css
            if(this.$clear) {
                //can position clear button only here, when form is shown and height can be calculated
//                var h = this.$input.outerHeight(true) || 20,
                var h = this.$clear.parent().height(),
                    delta = (h - this.$clear.height()) / 2;
                    
                //this.$clear.css({bottom: delta, right: delta});
            }
            */
		},

		//show / hide clear button
		toggleClear: function(e) {
			if (!this.$clear) {
				return;
			}

			var len = this.$input.val().length,
				visible = this.$clear.is(':visible');

			if (len && !visible) {
				this.$clear.show();
			}

			if (!len && visible) {
				this.$clear.hide();
			}
		},

		clear: function() {
			this.$clear.hide();
			this.$input.val('').focus();
		}
	});

	Text.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
		/**
		@property tpl 
		@default <input type="text">
		**/
		tpl: '<input type="text">',
		/**
		Placeholder attribute of input. Shown when input is empty.

		@property placeholder 
		@type string
		@default null
		**/
		placeholder: null,

		/**
		Whether to show `clear` button 
        
		@property clear 
		@type boolean
		@default true        
		**/
		clear: true
	});

	$.fn.editabletypes.text = Text;

}(window.jQuery));

/**
Textarea input

@class textarea
@extends abstractinput
@final
@example
<a href="#" id="comments" data-type="textarea" data-pk="1">awesome comment!</a>
<script>
$(function(){
    $('#comments').editable({
        url: '/post',
        title: 'Enter comments',
        rows: 10
    });
});
</script>
**/
(function($) {
	"use strict";

	var Textarea = function(options) {
		this.init('textarea', options, Textarea.defaults);
	};

	$.fn.editableutils.inherit(Textarea, $.fn.editabletypes.abstractinput);

	$.extend(Textarea.prototype, {
		render: function() {
			this.setClass();
			this.setAttr('placeholder');
			this.setAttr('rows');

			//ctrl + enter
			this.$input.keydown(function(e) {
				if (e.ctrlKey && e.which === 13) {
					$(this).closest('form').submit();
				}
			});
		},

		//using `white-space: pre-wrap` solves \n  <--> BR conversion very elegant!
		/* 
		value2html: function(value, element) {
		     var html = '', lines;
		     if(value) {
		         lines = value.split("\n");
		         for (var i = 0; i < lines.length; i++) {
		             lines[i] = $('<div>').text(lines[i]).html();
		         }
		         html = lines.join('<br>');
		     }
		     $(element).html(html);
		 },
       
		 html2value: function(html) {
		     if(!html) {
		         return '';
		     }

		     var regex = new RegExp(String.fromCharCode(10), 'g');
		     var lines = html.split(/<br\s*\/?>/i);
		     for (var i = 0; i < lines.length; i++) {
		         var text = $('<div>').html(lines[i]).text();

		         // Remove newline characters (\n) to avoid them being converted by value2html() method
		         // thus adding extra <br> tags
		         text = text.replace(regex, '');

		         lines[i] = text;
		     }
		     return lines.join("\n");
		 },
		  */
		activate: function() {
			$.fn.editabletypes.text.prototype.activate.call(this);
		}
	});

	Textarea.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
		/**
		@property tpl
		@default <textarea></textarea>
		**/
		tpl: '<textarea></textarea>',
		/**
		@property inputclass
		@default input-large
		**/
		inputclass: 'input-large',
		/**
		Placeholder attribute of input. Shown when input is empty.

		@property placeholder
		@type string
		@default null
		**/
		placeholder: null,
		/**
		Number of rows in textarea

		@property rows
		@type integer
		@default 7
		**/
		rows: 7
	});

	$.fn.editabletypes.textarea = Textarea;

}(window.jQuery));

/**
Select (dropdown)

@class select
@extends list
@final
@example
<a href="#" id="status" data-type="select" data-pk="1" data-url="/post" data-title="Select status"></a>
<script>
$(function(){
    $('#status').editable({
        value: 2,    
        source: [
              {value: 1, text: 'Active'},
              {value: 2, text: 'Blocked'},
              {value: 3, text: 'Deleted'}
           ]
    });
});
</script>
**/
(function($) {
	"use strict";

	var Select = function(options) {
		this.init('select', options, Select.defaults);
	};

	$.fn.editableutils.inherit(Select, $.fn.editabletypes.list);

	$.extend(Select.prototype, {
		renderList: function() {
			this.$input.empty();

			var fillItems = function($el, data) {
				var attr;
				if ($.isArray(data)) {
					for (var i = 0; i < data.length; i++) {
						attr = {};
						if (data[i].children) {
							attr.label = data[i].text;
							$el.append(fillItems($('<optgroup>', attr), data[i].children));
						} else {
							attr.value = data[i].value;
							if (data[i].disabled) {
								attr.disabled = true;
							}
							$el.append($('<option>', attr).text(data[i].text));
						}
					}
				}
				return $el;
			};

			fillItems(this.$input, this.sourceData);

			this.setClass();

			//enter submit
			this.$input.on('keydown.editable', function(e) {
				if (e.which === 13) {
					$(this).closest('form').submit();
				}
			});
		},

		value2htmlFinal: function(value, element) {
			var text = '',
				items = $.fn.editableutils.itemsByValue(value, this.sourceData);

			if (items.length) {
				text = items[0].text;
			}

			//$(element).text(text);
			$.fn.editabletypes.abstractinput.prototype.value2html.call(this, text, element);
		},

		autosubmit: function() {
			this.$input.off('keydown.editable').on('change.editable', function() {
				$(this).closest('form').submit();
			});
		}
	});

	Select.defaults = $.extend({}, $.fn.editabletypes.list.defaults, {
		/**
		@property tpl 
		@default <select></select>
		**/
		tpl: '<select></select>'
	});

	$.fn.editabletypes.select = Select;

}(window.jQuery));

/**
List of checkboxes. 
Internally value stored as javascript array of values.

@class checklist
@extends list
@final
@example
<a href="#" id="options" data-type="checklist" data-pk="1" data-url="/post" data-title="Select options"></a>
<script>
$(function(){
    $('#options').editable({
        value: [2, 3],    
        source: [
              {value: 1, text: 'option1'},
              {value: 2, text: 'option2'},
              {value: 3, text: 'option3'}
           ]
    });
});
</script>
**/
(function($) {
	"use strict";

	var Checklist = function(options) {
		this.init('checklist', options, Checklist.defaults);
	};

	$.fn.editableutils.inherit(Checklist, $.fn.editabletypes.list);

	$.extend(Checklist.prototype, {
		renderList: function() {
			var $label, $div;

			this.$tpl.empty();

			if (!$.isArray(this.sourceData)) {
				return;
			}

			for (var i = 0; i < this.sourceData.length; i++) {
				$label = $('<label>').append($('<input>', {
						type: 'checkbox',
						value: this.sourceData[i].value
					}))
					.append($('<span>').text(' ' + this.sourceData[i].text));

				$('<div>').append($label).appendTo(this.$tpl);
			}

			this.$input = this.$tpl.find('input[type="checkbox"]');
			this.setClass();
		},

		value2str: function(value) {
			return $.isArray(value) ? value.sort().join($.trim(this.options.separator)) : '';
		},

		//parse separated string
		str2value: function(str) {
			var reg, value = null;
			if (typeof str === 'string' && str.length) {
				reg = new RegExp('\\s*' + $.trim(this.options.separator) + '\\s*');
				value = str.split(reg);
			} else if ($.isArray(str)) {
				value = str;
			} else {
				value = [str];
			}
			return value;
		},

		//set checked on required checkboxes
		value2input: function(value) {
			this.$input.prop('checked', false);
			if ($.isArray(value) && value.length) {
				this.$input.each(function(i, el) {
					var $el = $(el);
					// cannot use $.inArray as it performs strict comparison
					$.each(value, function(j, val) {
						/*jslint eqeq: true*/
						if ($el.val() == val) {
							/*jslint eqeq: false*/
							$el.prop('checked', true);
						}
					});
				});
			}
		},

		input2value: function() {
			var checked = [];
			this.$input.filter(':checked').each(function(i, el) {
				checked.push($(el).val());
			});
			return checked;
		},

		//collect text of checked boxes
		value2htmlFinal: function(value, element) {
			var html = [],
				checked = $.fn.editableutils.itemsByValue(value, this.sourceData),
				escape = this.options.escape;

			if (checked.length) {
				$.each(checked, function(i, v) {
					var text = escape ? $.fn.editableutils.escape(v.text) : v.text;
					html.push(text);
				});
				$(element).html(html.join('<br>'));
			} else {
				$(element).empty();
			}
		},

		activate: function() {
			this.$input.first().focus();
		},

		autosubmit: function() {
			this.$input.on('keydown', function(e) {
				if (e.which === 13) {
					$(this).closest('form').submit();
				}
			});
		}
	});

	Checklist.defaults = $.extend({}, $.fn.editabletypes.list.defaults, {
		/**
		@property tpl 
		@default <div></div>
		**/
		tpl: '<div class="editable-checklist"></div>',

		/**
		@property inputclass 
		@type string
		@default null
		**/
		inputclass: null,

		/**
		Separator of values when reading from `data-value` attribute

		@property separator 
		@type string
		@default ','
		**/
		separator: ','
	});

	$.fn.editabletypes.checklist = Checklist;

}(window.jQuery));

/**
HTML5 input types.
Following types are supported:

* password
* email
* url
* tel
* number
* range
* time

Learn more about html5 inputs:  
http://www.w3.org/wiki/HTML5_form_additions  
To check browser compatibility please see:  
https://developer.mozilla.org/en-US/docs/HTML/Element/Input
            
@class html5types 
@extends text
@final
@since 1.3.0
@example
<a href="#" id="email" data-type="email" data-pk="1">admin@example.com</a>
<script>
$(function(){
    $('#email').editable({
        url: '/post',
        title: 'Enter email'
    });
});
</script>
**/

/**
@property tpl 
@default depends on type
**/

/*
Password
*/
(function($) {
	"use strict";

	var Password = function(options) {
		this.init('password', options, Password.defaults);
	};
	$.fn.editableutils.inherit(Password, $.fn.editabletypes.text);
	$.extend(Password.prototype, {
		//do not display password, show '[hidden]' instead
		value2html: function(value, element) {
			if (value) {
				$(element).text('[hidden]');
			} else {
				$(element).empty();
			}
		},
		//as password not displayed, should not set value by html
		html2value: function(html) {
			return null;
		}
	});
	Password.defaults = $.extend({}, $.fn.editabletypes.text.defaults, {
		tpl: '<input type="password">'
	});
	$.fn.editabletypes.password = Password;
}(window.jQuery));

/*
Email
*/
(function($) {
	"use strict";

	var Email = function(options) {
		this.init('email', options, Email.defaults);
	};
	$.fn.editableutils.inherit(Email, $.fn.editabletypes.text);
	Email.defaults = $.extend({}, $.fn.editabletypes.text.defaults, {
		tpl: '<input type="email">'
	});
	$.fn.editabletypes.email = Email;
}(window.jQuery));

/*
Url
*/
(function($) {
	"use strict";

	var Url = function(options) {
		this.init('url', options, Url.defaults);
	};
	$.fn.editableutils.inherit(Url, $.fn.editabletypes.text);
	Url.defaults = $.extend({}, $.fn.editabletypes.text.defaults, {
		tpl: '<input type="url">'
	});
	$.fn.editabletypes.url = Url;
}(window.jQuery));

/*
Tel
*/
(function($) {
	"use strict";

	var Tel = function(options) {
		this.init('tel', options, Tel.defaults);
	};
	$.fn.editableutils.inherit(Tel, $.fn.editabletypes.text);
	Tel.defaults = $.extend({}, $.fn.editabletypes.text.defaults, {
		tpl: '<input type="tel">'
	});
	$.fn.editabletypes.tel = Tel;
}(window.jQuery));

/*
Number
*/
(function($) {
	"use strict";

	var NumberInput = function(options) {
		this.init('number', options, NumberInput.defaults);
	};
	$.fn.editableutils.inherit(NumberInput, $.fn.editabletypes.text);
	$.extend(NumberInput.prototype, {
		render: function() {
			NumberInput.superclass.render.call(this);
			this.setAttr('min');
			this.setAttr('max');
			this.setAttr('step');
		},
		postrender: function() {
			if (this.$clear) {
				//increase right ffset  for up/down arrows
				this.$clear.css({
					right: 24
				});
				/*
				//can position clear button only here, when form is shown and height can be calculated
				var h = this.$input.outerHeight(true) || 20,
				    delta = (h - this.$clear.height()) / 2;
                
				//add 12px to offset right for up/down arrows    
				this.$clear.css({top: delta, right: delta + 16});
				*/
			}
		}
	});
	NumberInput.defaults = $.extend({}, $.fn.editabletypes.text.defaults, {
		tpl: '<input type="number">',
		inputclass: 'input-mini',
		min: null,
		max: null,
		step: null
	});
	$.fn.editabletypes.number = NumberInput;
}(window.jQuery));

/*
Range (inherit from number)
*/
(function($) {
	"use strict";

	var Range = function(options) {
		this.init('range', options, Range.defaults);
	};
	$.fn.editableutils.inherit(Range, $.fn.editabletypes.number);
	$.extend(Range.prototype, {
		render: function() {
			this.$input = this.$tpl.filter('input');

			this.setClass();
			this.setAttr('min');
			this.setAttr('max');
			this.setAttr('step');

			this.$input.on('input', function() {
				$(this).siblings('output').text($(this).val());
			});
		},
		activate: function() {
			this.$input.focus();
		}
	});
	Range.defaults = $.extend({}, $.fn.editabletypes.number.defaults, {
		tpl: '<input type="range"><output style="width: 30px; display: inline-block"></output>',
		inputclass: 'input-medium'
	});
	$.fn.editabletypes.range = Range;
}(window.jQuery));

/*
Time
*/
(function($) {
	"use strict";

	var Time = function(options) {
		this.init('time', options, Time.defaults);
	};
	//inherit from abstract, as inheritance from text gives selection error.
	$.fn.editableutils.inherit(Time, $.fn.editabletypes.abstractinput);
	$.extend(Time.prototype, {
		render: function() {
			this.setClass();
		}
	});
	Time.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
		tpl: '<input type="time">'
	});
	$.fn.editabletypes.time = Time;
}(window.jQuery));

/**
Select2 input. Based on amazing work of Igor Vaynberg https://github.com/ivaynberg/select2.  
Please see [original select2 docs](http://ivaynberg.github.com/select2) for detailed description and options.  
 
You should manually download and include select2 distributive:  

    <link href="select2/select2.css" rel="stylesheet" type="text/css"></link>  
    <script src="select2/select2.js"></script>  
    
To make it **bootstrap-styled** you can use css from [here](https://github.com/t0m/select2-bootstrap-css): 

    <link href="select2-bootstrap.css" rel="stylesheet" type="text/css"></link>    
    
**Note:** currently `autotext` feature does not work for select2 with `ajax` remote source.    
You need initially put both `data-value` and element's text youself:    

    <a href="#" data-type="select2" data-value="1">Text1</a>
    
    
@class select2
@extends abstractinput
@since 1.4.1
@final
@example
<a href="#" id="country" data-type="select2" data-pk="1" data-value="ru" data-url="/post" data-title="Select country"></a>
<script>
$(function(){
    //local source
    $('#country').editable({
        source: [
              {id: 'gb', text: 'Great Britain'},
              {id: 'us', text: 'United States'},
              {id: 'ru', text: 'Russia'}
           ],
        select2: {
           multiple: true
        }
    });
    //remote source (simple)
    $('#country').editable({
        source: '/getCountries',
        select2: {
            placeholder: 'Select Country',
            minimumInputLength: 1
        }
    });
    //remote source (advanced)
    $('#country').editable({
        select2: {
            placeholder: 'Select Country',
            allowClear: true,
            minimumInputLength: 3,
            id: function (item) {
                return item.CountryId;
            },
            ajax: {
                url: '/getCountries',
                dataType: 'json',
                data: function (term, page) {
                    return { query: term };
                },
                results: function (data, page) {
                    return { results: data };
                }
            },
            formatResult: function (item) {
                return item.CountryName;
            },
            formatSelection: function (item) {
                return item.CountryName;
            },
            initSelection: function (element, callback) {
                return $.get('/getCountryById', { query: element.val() }, function (data) {
                    callback(data);
                });
            } 
        }  
    });
});
</script>
**/
(function($) {
	"use strict";

	var Constructor = function(options) {
		this.init('select2', options, Constructor.defaults);

		options.select2 = options.select2 || {};

		this.sourceData = null;

		//placeholder
		if (options.placeholder) {
			options.select2.placeholder = options.placeholder;
		}

		//if not `tags` mode, use source
		if (!options.select2.tags && options.source) {
			var source = options.source;
			//if source is function, call it (once!)
			if ($.isFunction(options.source)) {
				source = options.source.call(options.scope);
			}

			if (typeof source === 'string') {
				options.select2.ajax = options.select2.ajax || {};
				//some default ajax params
				if (!options.select2.ajax.data) {
					options.select2.ajax.data = function(term) {
						return {
							query: term
						};
					};
				}
				if (!options.select2.ajax.results) {
					options.select2.ajax.results = function(data) {
						return {
							results: data
						};
					};
				}
				options.select2.ajax.url = source;
			} else {
				//check format and convert x-editable format to select2 format (if needed)
				this.sourceData = this.convertSource(source);
				options.select2.data = this.sourceData;
			}
		}

		//overriding objects in config (as by default jQuery extend() is not recursive)
		this.options.select2 = $.extend({}, Constructor.defaults.select2, options.select2);

		//detect whether it is multi-valued
		this.isMultiple = this.options.select2.tags || this.options.select2.multiple;
		this.isRemote = ('ajax' in this.options.select2);

		//store function returning ID of item
		//should be here as used inautotext for local source
		this.idFunc = this.options.select2.id;
		if (typeof(this.idFunc) !== "function") {
			var idKey = this.idFunc || 'id';
			this.idFunc = function(e) {
				return e[idKey];
			};
		}

		//store function that renders text in select2
		this.formatSelection = this.options.select2.formatSelection;
		if (typeof(this.formatSelection) !== "function") {
			this.formatSelection = function(e) {
				return e.text;
			};
		}
	};

	$.fn.editableutils.inherit(Constructor, $.fn.editabletypes.abstractinput);

	$.extend(Constructor.prototype, {
		render: function() {
			this.setClass();

			//can not apply select2 here as it calls initSelection 
			//over input that does not have correct value yet.
			//apply select2 only in value2input
			//this.$input.select2(this.options.select2);

			//when data is loaded via ajax, we need to know when it's done to populate listData
			if (this.isRemote) {
				//listen to loaded event to populate data
				this.$input.on('select2-loaded', $.proxy(function(e) {
					this.sourceData = e.items.results;
				}, this));
			}

			//trigger resize of editableform to re-position container in multi-valued mode
			if (this.isMultiple) {
				this.$input.on('change', function() {
					$(this).closest('form').parent().triggerHandler('resize');
				});
			}
		},

		value2html: function(value, element) {
			var text = '',
				data,
				that = this;

			if (this.options.select2.tags) { //in tags mode just assign value
				data = value;
				//data = $.fn.editableutils.itemsByValue(value, this.options.select2.tags, this.idFunc);
			} else if (this.sourceData) {
				data = $.fn.editableutils.itemsByValue(value, this.sourceData, this.idFunc);
			} else {
				//can not get list of possible values 
				//(e.g. autotext for select2 with ajax source)
			}

			//data may be array (when multiple values allowed)
			if ($.isArray(data)) {
				//collect selected data and show with separator
				text = [];
				$.each(data, function(k, v) {
					text.push(v && typeof v === 'object' ? that.formatSelection(v) : v);
				});
			} else if (data) {
				text = that.formatSelection(data);
			}

			text = $.isArray(text) ? text.join(this.options.viewseparator) : text;

			//$(element).text(text);
			Constructor.superclass.value2html.call(this, text, element);
		},

		html2value: function(html) {
			return this.options.select2.tags ? this.str2value(html, this.options.viewseparator) : null;
		},

		value2input: function(value) {
			// if value array => join it anyway
			if ($.isArray(value)) {
				value = value.join(this.getSeparator());
			}

			//for remote source just set value, text is updated by initSelection
			if (!this.$input.data('select2')) {
				this.$input.val(value);
				this.$input.select2(this.options.select2);
			} else {
				//second argument needed to separate initial change from user's click (for autosubmit)   
				this.$input.val(value).trigger('change', true);

				//Uncaught Error: cannot call val() if initSelection() is not defined
				//this.$input.select2('val', value);
			}

			// if defined remote source AND no multiple mode AND no user's initSelection provided --> 
			// we should somehow get text for provided id.
			// The solution is to use element's text as text for that id (exclude empty)
			if (this.isRemote && !this.isMultiple && !this.options.select2.initSelection) {
				// customId and customText are methods to extract `id` and `text` from data object
				// we can use this workaround only if user did not define these methods
				// otherwise we cant construct data object
				var customId = this.options.select2.id,
					customText = this.options.select2.formatSelection;

				if (!customId && !customText) {
					var $el = $(this.options.scope);
					if (!$el.data('editable').isEmpty) {
						var data = {
							id: value,
							text: $el.text()
						};
						this.$input.select2('data', data);
					}
				}
			}
		},

		input2value: function() {
			return this.$input.select2('val');
		},

		str2value: function(str, separator) {
			if (typeof str !== 'string' || !this.isMultiple) {
				return str;
			}

			separator = separator || this.getSeparator();

			var val, i, l;

			if (str === null || str.length < 1) {
				return null;
			}
			val = str.split(separator);
			for (i = 0, l = val.length; i < l; i = i + 1) {
				val[i] = $.trim(val[i]);
			}

			return val;
		},

		autosubmit: function() {
			this.$input.on('change', function(e, isInitial) {
				if (!isInitial) {
					$(this).closest('form').submit();
				}
			});
		},

		getSeparator: function() {
			return this.options.select2.separator || $.fn.select2.defaults.separator;
		},

		/*
		Converts source from x-editable format: {value: 1, text: "1"} to
		select2 format: {id: 1, text: "1"}
		*/
		convertSource: function(source) {
			if ($.isArray(source) && source.length && source[0].value !== undefined) {
				for (var i = 0; i < source.length; i++) {
					if (source[i].value !== undefined) {
						source[i].id = source[i].value;
						delete source[i].value;
					}
				}
			}
			return source;
		},

		destroy: function() {
			if (this.$input.data('select2')) {
				this.$input.select2('destroy');
			}
		}

	});

	Constructor.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
		/**
		@property tpl 
		@default <input type="hidden">
		**/
		tpl: '<input type="hidden">',
		/**
		Configuration of select2. [Full list of options](http://ivaynberg.github.com/select2).

		@property select2 
		@type object
		@default null
		**/
		select2: null,
		/**
		Placeholder attribute of select

		@property placeholder 
		@type string
		@default null
		**/
		placeholder: null,
		/**
		Source data for select. It will be assigned to select2 `data` property and kept here just for convenience.
		Please note, that format is different from simple `select` input: use 'id' instead of 'value'.
		E.g. `[{id: 1, text: "text1"}, {id: 2, text: "text2"}, ...]`.

		@property source 
		@type array|string|function
		@default null        
		**/
		source: null,
		/**
		Separator used to display tags.

		@property viewseparator 
		@type string
		@default ', '        
		**/
		viewseparator: ', '
	});

	$.fn.editabletypes.select2 = Constructor;

}(window.jQuery));

/**
 * Combodate - 1.0.5
 * Dropdown date and time picker.
 * Converts text input into dropdowns to pick day, month, year, hour, minute and second.
 * Uses momentjs as datetime library http://momentjs.com.
 * For i18n include corresponding file from https://github.com/timrwood/moment/tree/master/lang 
 *
 * Confusion at noon and midnight - see http://en.wikipedia.org/wiki/12-hour_clock#Confusion_at_noon_and_midnight
 * In combodate: 
 * 12:00 pm --> 12:00 (24-h format, midday)
 * 12:00 am --> 00:00 (24-h format, midnight, start of day)
 * 
 * Differs from momentjs parse rules:
 * 00:00 pm, 12:00 pm --> 12:00 (24-h format, day not change)
 * 00:00 am, 12:00 am --> 00:00 (24-h format, day not change)
 * 
 * 
 * Author: Vitaliy Potapov
 * Project page: http://github.com/vitalets/combodate
 * Copyright (c) 2012 Vitaliy Potapov. Released under MIT License.
 **/
(function($) {

	var Combodate = function(element, options) {
		this.$element = $(element);
		if (!this.$element.is('input')) {
			$.error('Combodate should be applied to INPUT element');
			return;
		}
		this.options = $.extend({}, $.fn.combodate.defaults, options, this.$element.data());
		this.init();
	};

	Combodate.prototype = {
		constructor: Combodate,
		init: function() {
			this.map = {
				//key   regexp    moment.method
				day: ['D', 'date'],
				month: ['M', 'month'],
				year: ['Y', 'year'],
				hour: ['[Hh]', 'hours'],
				minute: ['m', 'minutes'],
				second: ['s', 'seconds'],
				ampm: ['[Aa]', '']
			};

			this.$widget = $('<span class="combodate"></span>').html(this.getTemplate());

			this.initCombos();

			//update original input on change 
			this.$widget.on('change', 'select', $.proxy(function(e) {
				this.$element.val(this.getValue()).change();
				// update days count if month or year changes
				if (this.options.smartDays) {
					if ($(e.target).is('.month') || $(e.target).is('.year')) {
						this.fillCombo('day');
					}
				}
			}, this));

			this.$widget.find('select').css('width', 'auto');

			// hide original input and insert widget                                       
			this.$element.hide().after(this.$widget);

			// set initial value
			this.setValue(this.$element.val() || this.options.value);
		},

		/*
		 Replace tokens in template with <select> elements 
		*/
		getTemplate: function() {
			var tpl = this.options.template;

			//first pass
			$.each(this.map, function(k, v) {
				v = v[0];
				var r = new RegExp(v + '+'),
					token = v.length > 1 ? v.substring(1, 2) : v;

				tpl = tpl.replace(r, '{' + token + '}');
			});

			//replace spaces with &nbsp;
			tpl = tpl.replace(/ /g, '&nbsp;');

			//second pass
			$.each(this.map, function(k, v) {
				v = v[0];
				var token = v.length > 1 ? v.substring(1, 2) : v;

				tpl = tpl.replace('{' + token + '}', '<select class="' + k + '"></select>');
			});

			return tpl;
		},

		/*
		 Initialize combos that presents in template 
		*/
		initCombos: function() {
			for (var k in this.map) {
				var $c = this.$widget.find('.' + k);
				// set properties like this.$day, this.$month etc.
				this['$' + k] = $c.length ? $c : null;
				// fill with items
				this.fillCombo(k);
			}
		},

		/*
		 Fill combo with items 
		*/
		fillCombo: function(k) {
			var $combo = this['$' + k];
			if (!$combo) {
				return;
			}

			// define method name to fill items, e.g `fillDays`
			var f = 'fill' + k.charAt(0).toUpperCase() + k.slice(1);
			var items = this[f]();
			var value = $combo.val();

			$combo.empty();
			for (var i = 0; i < items.length; i++) {
				$combo.append('<option value="' + items[i][0] + '">' + items[i][1] + '</option>');
			}

			$combo.val(value);
		},

		/*
		 Initialize items of combos. Handles `firstItem` option 
		*/
		fillCommon: function(key) {
			var values = [],
				relTime;

			if (this.options.firstItem === 'name') {
				//need both to support moment ver < 2 and  >= 2
				relTime = moment.relativeTime || moment.langData()._relativeTime;
				var header = typeof relTime[key] === 'function' ? relTime[key](1, true, key, false) : relTime[key];
				//take last entry (see momentjs lang files structure) 
				header = header.split(' ').reverse()[0];
				values.push(['', header]);
			} else if (this.options.firstItem === 'empty') {
				values.push(['', '']);
			}
			return values;
		},

		/*
		fill day
		*/
		fillDay: function() {
			var items = this.fillCommon('d'),
				name, i,
				twoDigit = this.options.template.indexOf('DD') !== -1,
				daysCount = 31;

			// detect days count (depends on month and year)
			// originally https://github.com/vitalets/combodate/pull/7
			if (this.options.smartDays && this.$month && this.$year) {
				var month = parseInt(this.$month.val(), 10);
				var year = parseInt(this.$year.val(), 10);

				if (!isNaN(month) && !isNaN(year)) {
					daysCount = moment([year, month]).daysInMonth();
				}
			}

			for (i = 1; i <= daysCount; i++) {
				name = twoDigit ? this.leadZero(i) : i;
				items.push([i, name]);
			}
			return items;
		},

		/*
		fill month
		*/
		fillMonth: function() {
			var items = this.fillCommon('M'),
				name, i,
				longNames = this.options.template.indexOf('MMMM') !== -1,
				shortNames = this.options.template.indexOf('MMM') !== -1,
				twoDigit = this.options.template.indexOf('MM') !== -1;

			for (i = 0; i <= 11; i++) {
				if (longNames) {
					//see https://github.com/timrwood/momentjs.com/pull/36
					name = moment().date(1).month(i).format('MMMM');
				} else if (shortNames) {
					name = moment().date(1).month(i).format('MMM');
				} else if (twoDigit) {
					name = this.leadZero(i + 1);
				} else {
					name = i + 1;
				}
				items.push([i, name]);
			}
			return items;
		},

		/*
		fill year
		*/
		fillYear: function() {
			var items = [],
				name, i,
				longNames = this.options.template.indexOf('YYYY') !== -1;

			for (i = this.options.maxYear; i >= this.options.minYear; i--) {
				name = longNames ? i : (i + '').substring(2);
				items[this.options.yearDescending ? 'push' : 'unshift']([i, name]);
			}

			items = this.fillCommon('y').concat(items);

			return items;
		},

		/*
		fill hour
		*/
		fillHour: function() {
			var items = this.fillCommon('h'),
				name, i,
				h12 = this.options.template.indexOf('h') !== -1,
				h24 = this.options.template.indexOf('H') !== -1,
				twoDigit = this.options.template.toLowerCase().indexOf('hh') !== -1,
				min = h12 ? 1 : 0,
				max = h12 ? 12 : 23;

			for (i = min; i <= max; i++) {
				name = twoDigit ? this.leadZero(i) : i;
				items.push([i, name]);
			}
			return items;
		},

		/*
		fill minute
		*/
		fillMinute: function() {
			var items = this.fillCommon('m'),
				name, i,
				twoDigit = this.options.template.indexOf('mm') !== -1;

			for (i = 0; i <= 59; i += this.options.minuteStep) {
				name = twoDigit ? this.leadZero(i) : i;
				items.push([i, name]);
			}
			return items;
		},

		/*
		fill second
		*/
		fillSecond: function() {
			var items = this.fillCommon('s'),
				name, i,
				twoDigit = this.options.template.indexOf('ss') !== -1;

			for (i = 0; i <= 59; i += this.options.secondStep) {
				name = twoDigit ? this.leadZero(i) : i;
				items.push([i, name]);
			}
			return items;
		},

		/*
		fill ampm
		*/
		fillAmpm: function() {
			var ampmL = this.options.template.indexOf('a') !== -1,
				ampmU = this.options.template.indexOf('A') !== -1,
				items = [
					['am', ampmL ? 'am' : 'AM'],
					['pm', ampmL ? 'pm' : 'PM']
				];
			return items;
		},

		/*
		 Returns current date value from combos. 
		 If format not specified - `options.format` used.
		 If format = `null` - Moment object returned.
		*/
		getValue: function(format) {
			var dt, values = {},
				that = this,
				notSelected = false;

			//getting selected values    
			$.each(this.map, function(k, v) {
				if (k === 'ampm') {
					return;
				}
				var def = k === 'day' ? 1 : 0;

				values[k] = that['$' + k] ? parseInt(that['$' + k].val(), 10) : def;

				if (isNaN(values[k])) {
					notSelected = true;
					return false;
				}
			});

			//if at least one visible combo not selected - return empty string
			if (notSelected) {
				return '';
			}

			//convert hours 12h --> 24h 
			if (this.$ampm) {
				//12:00 pm --> 12:00 (24-h format, midday), 12:00 am --> 00:00 (24-h format, midnight, start of day)
				if (values.hour === 12) {
					values.hour = this.$ampm.val() === 'am' ? 0 : 12;
				} else {
					values.hour = this.$ampm.val() === 'am' ? values.hour : values.hour + 12;
				}
			}

			dt = moment([values.year, values.month, values.day, values.hour, values.minute, values.second]);

			//highlight invalid date
			this.highlight(dt);

			format = format === undefined ? this.options.format : format;
			if (format === null) {
				return dt.isValid() ? dt : null;
			} else {
				return dt.isValid() ? dt.format(format) : '';
			}
		},

		setValue: function(value) {
			if (!value) {
				return;
			}

			var dt = typeof value === 'string' ? moment(value, this.options.format) : moment(value),
				that = this,
				values = {};

			//function to find nearest value in select options
			function getNearest($select, value) {
				var delta = {};
				$select.children('option').each(function(i, opt) {
					var optValue = $(opt).attr('value'),
						distance;

					if (optValue === '') return;
					distance = Math.abs(optValue - value);
					if (typeof delta.distance === 'undefined' || distance < delta.distance) {
						delta = {
							value: optValue,
							distance: distance
						};
					}
				});
				return delta.value;
			}

			if (dt.isValid()) {
				//read values from date object
				$.each(this.map, function(k, v) {
					if (k === 'ampm') {
						return;
					}
					values[k] = dt[v[1]]();
				});

				if (this.$ampm) {
					//12:00 pm --> 12:00 (24-h format, midday), 12:00 am --> 00:00 (24-h format, midnight, start of day)
					if (values.hour >= 12) {
						values.ampm = 'pm';
						if (values.hour > 12) {
							values.hour -= 12;
						}
					} else {
						values.ampm = 'am';
						if (values.hour === 0) {
							values.hour = 12;
						}
					}
				}

				$.each(values, function(k, v) {
					//call val() for each existing combo, e.g. this.$hour.val()
					if (that['$' + k]) {

						if (k === 'minute' && that.options.minuteStep > 1 && that.options.roundTime) {
							v = getNearest(that['$' + k], v);
						}

						if (k === 'second' && that.options.secondStep > 1 && that.options.roundTime) {
							v = getNearest(that['$' + k], v);
						}

						that['$' + k].val(v);
					}
				});

				// update days count
				if (this.options.smartDays) {
					this.fillCombo('day');
				}

				this.$element.val(dt.format(this.options.format)).change();
			}
		},

		/*
		 highlight combos if date is invalid
		*/
		highlight: function(dt) {
			if (!dt.isValid()) {
				if (this.options.errorClass) {
					this.$widget.addClass(this.options.errorClass);
				} else {
					//store original border color
					if (!this.borderColor) {
						this.borderColor = this.$widget.find('select').css('border-color');
					}
					this.$widget.find('select').css('border-color', 'red');
				}
			} else {
				if (this.options.errorClass) {
					this.$widget.removeClass(this.options.errorClass);
				} else {
					this.$widget.find('select').css('border-color', this.borderColor);
				}
			}
		},

		leadZero: function(v) {
			return v <= 9 ? '0' + v : v;
		},

		destroy: function() {
			this.$widget.remove();
			this.$element.removeData('combodate').show();
		}

		//todo: clear method        
	};

	$.fn.combodate = function(option) {
		var d, args = Array.apply(null, arguments);
		args.shift();

		//getValue returns date as string / object (not jQuery object)
		if (option === 'getValue' && this.length && (d = this.eq(0).data('combodate'))) {
			return d.getValue.apply(d, args);
		}

		return this.each(function() {
			var $this = $(this),
				data = $this.data('combodate'),
				options = typeof option == 'object' && option;
			if (!data) {
				$this.data('combodate', (data = new Combodate(this, options)));
			}
			if (typeof option == 'string' && typeof data[option] == 'function') {
				data[option].apply(data, args);
			}
		});
	};

	$.fn.combodate.defaults = {
		//in this format value stored in original input
		format: 'DD-MM-YYYY HH:mm',
		//in this format items in dropdowns are displayed
		template: 'D / MMM / YYYY   H : mm',
		//initial value, can be `new Date()`    
		value: null,
		minYear: 1970,
		maxYear: new Date().getFullYear(),
		yearDescending: true,
		minuteStep: 5,
		secondStep: 1,
		firstItem: 'empty', //'name', 'empty', 'none'
		errorClass: null,
		roundTime: true, // whether to round minutes and seconds if step > 1
		smartDays: false // whether days in combo depend on selected month: 31, 30, 28
	};

}(window.jQuery));
/**
Combodate input - dropdown date and time picker.    
Based on [combodate](http://vitalets.github.com/combodate) plugin (included). To use it you should manually include [momentjs](http://momentjs.com).

    <script src="js/moment.min.js"></script>
   
Allows to input:

* only date
* only time 
* both date and time  

Please note, that format is taken from momentjs and **not compatible** with bootstrap-datepicker / jquery UI datepicker.  
Internally value stored as `momentjs` object. 

@class combodate
@extends abstractinput
@final
@since 1.4.0
@example
<a href="#" id="dob" data-type="combodate" data-pk="1" data-url="/post" data-value="1984-05-15" data-title="Select date"></a>
<script>
$(function(){
    $('#dob').editable({
        format: 'YYYY-MM-DD',    
        viewformat: 'DD.MM.YYYY',    
        template: 'D / MMMM / YYYY',    
        combodate: {
                minYear: 2000,
                maxYear: 2015,
                minuteStep: 1
           }
        }
    });
});
</script>
**/

/*global moment*/

(function($) {
	"use strict";

	var Constructor = function(options) {
		this.init('combodate', options, Constructor.defaults);

		//by default viewformat equals to format
		if (!this.options.viewformat) {
			this.options.viewformat = this.options.format;
		}

		//try parse combodate config defined as json string in data-combodate
		options.combodate = $.fn.editableutils.tryParseJson(options.combodate, true);

		//overriding combodate config (as by default jQuery extend() is not recursive)
		this.options.combodate = $.extend({}, Constructor.defaults.combodate, options.combodate, {
			format: this.options.format,
			template: this.options.template
		});
	};

	$.fn.editableutils.inherit(Constructor, $.fn.editabletypes.abstractinput);

	$.extend(Constructor.prototype, {
		render: function() {
			this.$input.combodate(this.options.combodate);

			if ($.fn.editableform.engine === 'bs3') {
				this.$input.siblings().find('select').addClass('form-control');
			}

			if (this.options.inputclass) {
				this.$input.siblings().find('select').addClass(this.options.inputclass);
			}
			//"clear" link
			/*
			if(this.options.clear) {
			    this.$clear = $('<a href="#"></a>').html(this.options.clear).click($.proxy(function(e){
			        e.preventDefault();
			        e.stopPropagation();
			        this.clear();
			    }, this));
			    
			    this.$tpl.parent().append($('<div class="editable-clear">').append(this.$clear));  
			} 
			*/
		},

		value2html: function(value, element) {
			var text = value ? value.format(this.options.viewformat) : '';
			//$(element).text(text);
			Constructor.superclass.value2html.call(this, text, element);
		},

		html2value: function(html) {
			return html ? moment(html, this.options.viewformat) : null;
		},

		value2str: function(value) {
			return value ? value.format(this.options.format) : '';
		},

		str2value: function(str) {
			return str ? moment(str, this.options.format) : null;
		},

		value2submit: function(value) {
			return this.value2str(value);
		},

		value2input: function(value) {
			this.$input.combodate('setValue', value);
		},

		input2value: function() {
			return this.$input.combodate('getValue', null);
		},

		activate: function() {
			this.$input.siblings('.combodate').find('select').eq(0).focus();
		},

		/*
		clear:  function() {
		   this.$input.data('datepicker').date = null;
		   this.$input.find('.active').removeClass('active');
		},
		*/

		autosubmit: function() {

		}

	});

	Constructor.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
		/**
		@property tpl 
		@default <input type="text">
		**/
		tpl: '<input type="text">',
		/**
		@property inputclass 
		@default null
		**/
		inputclass: null,
		/**
		Format used for sending value to server. Also applied when converting date from <code>data-value</code> attribute.<br>
		See list of tokens in [momentjs docs](http://momentjs.com/docs/#/parsing/string-format)  
        
		@property format 
		@type string
		@default YYYY-MM-DD
		**/
		format: 'YYYY-MM-DD',
		/**
		Format used for displaying date. Also applied when converting date from element's text on init.   
		If not specified equals to `format`.
        
		@property viewformat 
		@type string
		@default null
		**/
		viewformat: null,
		/**
		Template used for displaying dropdowns.
        
		@property template 
		@type string
		@default D / MMM / YYYY
		**/
		template: 'D / MMM / YYYY',
		/**
		Configuration of combodate.
		Full list of options: http://vitalets.github.com/combodate/#docs
        
		@property combodate 
		@type object
		@default null
		**/
		combodate: null

		/*
		(not implemented yet)
		Text shown as clear date button. 
		If <code>false</code> clear button will not be rendered.
        
		@property clear 
		@type boolean|string
		@default 'x clear'         
		*/
		//clear: '&times; clear'
	});

	$.fn.editabletypes.combodate = Constructor;

}(window.jQuery));

/*
Editableform based on Twitter Bootstrap 3
*/
(function($) {
	"use strict";

	//store parent methods
	var pInitInput = $.fn.editableform.Constructor.prototype.initInput;

	$.extend($.fn.editableform.Constructor.prototype, {
		initTemplate: function() {
			this.$form = $($.fn.editableform.template);
			this.$form.find('.control-group').addClass('form-group');
			this.$form.find('.editable-error-block').addClass('help-block');
		},
		initInput: function() {
			pInitInput.apply(this);

			//for bs3 set default class `input-sm` to standard inputs
			var emptyInputClass = this.input.options.inputclass === null || this.input.options.inputclass === false;
			var defaultClass = 'input-sm';

			//bs3 add `form-control` class to standard inputs
			var stdtypes = 'text,select,textarea,password,email,url,tel,number,range,time,typeaheadjs'.split(',');
			if (~$.inArray(this.input.type, stdtypes)) {
				this.input.$input.addClass('form-control');
				if (emptyInputClass) {
					this.input.options.inputclass = defaultClass;
					this.input.$input.addClass(defaultClass);
				}
			}

			//apply bs3 size class also to buttons (to fit size of control)
			var $btn = this.$form.find('.editable-buttons');
			var classes = emptyInputClass ? [defaultClass] : this.input.options.inputclass.split(' ');
			for (var i = 0; i < classes.length; i++) {
				// `btn-sm` is default now
				/*
				if(classes[i].toLowerCase() === 'input-sm') { 
				    $btn.find('button').addClass('btn-sm');  
				}
				*/
				if (classes[i].toLowerCase() === 'input-lg') {
					$btn.find('button').removeClass('btn-sm').addClass('btn-lg');
				}
			}
		}
	});

	//buttons
	$.fn.editableform.buttons =
		'<button type="submit" class="btn btn-primary btn-sm editable-submit">' +
		'<i class="glyphicon glyphicon-ok"></i>' +
		'</button>' +
		'<button type="button" class="btn btn-default btn-sm editable-cancel">' +
		'<i class="glyphicon glyphicon-remove"></i>' +
		'</button>';

	//error classes
	$.fn.editableform.errorGroupClass = 'has-error';
	$.fn.editableform.errorBlockClass = null;
	//engine
	$.fn.editableform.engine = 'bs3';
}(window.jQuery));
/**
 * Editable Popover3 (for Bootstrap 3) 
 * ---------------------
 * requires bootstrap-popover.js
 */
(function($) {
	"use strict";

	//extend methods
	$.extend($.fn.editableContainer.Popup.prototype, {
		containerName: 'popover',
		containerDataName: 'bs.popover',
		innerCss: '.popover-content',
		defaults: $.fn.popover.Constructor.DEFAULTS,

		initContainer: function() {
			$.extend(this.containerOptions, {
				trigger: 'manual',
				selector: false,
				content: ' ',
				template: this.defaults.template
			});

			//as template property is used in inputs, hide it from popover
			var t;
			if (this.$element.data('template')) {
				t = this.$element.data('template');
				this.$element.removeData('template');
			}

			this.call(this.containerOptions);

			if (t) {
				//restore data('template')
				this.$element.data('template', t);
			}
		},

		/* show */
		innerShow: function() {
			this.call('show');
		},

		/* hide */
		innerHide: function() {
			this.call('hide');
		},

		/* destroy */
		innerDestroy: function() {
			this.call('destroy');
		},

		setContainerOption: function(key, value) {
			this.container().options[key] = value;
		},

		/**
		 * move popover to new position. This function mainly copied from bootstrap-popover.
		 */
		/*jshint laxcomma: true, eqeqeq: false*/
		setPosition: function() {

			(function() {
				/*    
                var $tip = this.tip()
                , inside
                , pos
                , actualWidth
                , actualHeight
                , placement
                , tp
                , tpt
                , tpb
                , tpl
                , tpr;

                placement = typeof this.options.placement === 'function' ?
                this.options.placement.call(this, $tip[0], this.$element[0]) :
                this.options.placement;

                inside = /in/.test(placement);
               
                $tip
              //  .detach()
              //vitalets: remove any placement class because otherwise they dont influence on re-positioning of visible popover
                .removeClass('top right bottom left')
                .css({ top: 0, left: 0, display: 'block' });
              //  .insertAfter(this.$element);
               
                pos = this.getPosition(inside);

                actualWidth = $tip[0].offsetWidth;
                actualHeight = $tip[0].offsetHeight;

                placement = inside ? placement.split(' ')[1] : placement;

                tpb = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2};
                tpt = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2};
                tpl = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth};
                tpr = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width};

                switch (placement) {
                    case 'bottom':
                        if ((tpb.top + actualHeight) > ($(window).scrollTop() + $(window).height())) {
                            if (tpt.top > $(window).scrollTop()) {
                                placement = 'top';
                            } else if ((tpr.left + actualWidth) < ($(window).scrollLeft() + $(window).width())) {
                                placement = 'right';
                            } else if (tpl.left > $(window).scrollLeft()) {
                                placement = 'left';
                            } else {
                                placement = 'right';
                            }
                        }
                        break;
                    case 'top':
                        if (tpt.top < $(window).scrollTop()) {
                            if ((tpb.top + actualHeight) < ($(window).scrollTop() + $(window).height())) {
                                placement = 'bottom';
                            } else if ((tpr.left + actualWidth) < ($(window).scrollLeft() + $(window).width())) {
                                placement = 'right';
                            } else if (tpl.left > $(window).scrollLeft()) {
                                placement = 'left';
                            } else {
                                placement = 'right';
                            }
                        }
                        break;
                    case 'left':
                        if (tpl.left < $(window).scrollLeft()) {
                            if ((tpr.left + actualWidth) < ($(window).scrollLeft() + $(window).width())) {
                                placement = 'right';
                            } else if (tpt.top > $(window).scrollTop()) {
                                placement = 'top';
                            } else if (tpt.top > $(window).scrollTop()) {
                                placement = 'bottom';
                            } else {
                                placement = 'right';
                            }
                        }
                        break;
                    case 'right':
                        if ((tpr.left + actualWidth) > ($(window).scrollLeft() + $(window).width())) {
                            if (tpl.left > $(window).scrollLeft()) {
                                placement = 'left';
                            } else if (tpt.top > $(window).scrollTop()) {
                                placement = 'top';
                            } else if (tpt.top > $(window).scrollTop()) {
                                placement = 'bottom';
                            }
                        }
                        break;
                }

                switch (placement) {
                    case 'bottom':
                        tp = tpb;
                        break;
                    case 'top':
                        tp = tpt;
                        break;
                    case 'left':
                        tp = tpl;
                        break;
                    case 'right':
                        tp = tpr;
                        break;
                }

                $tip
                .offset(tp)
                .addClass(placement)
                .addClass('in');
           */

				var $tip = this.tip();

				var placement = typeof this.options.placement == 'function' ?
					this.options.placement.call(this, $tip[0], this.$element[0]) :
					this.options.placement;

				var autoToken = /\s?auto?\s?/i;
				var autoPlace = autoToken.test(placement);
				if (autoPlace) {
					placement = placement.replace(autoToken, '') || 'top';
				}

				var pos = this.getPosition();
				var actualWidth = $tip[0].offsetWidth;
				var actualHeight = $tip[0].offsetHeight;

				if (autoPlace) {
					var $parent = this.$element.parent();

					var orgPlacement = placement;
					var docScroll = document.documentElement.scrollTop || document.body.scrollTop;
					var parentWidth = this.options.container == 'body' ? window.innerWidth : $parent.outerWidth();
					var parentHeight = this.options.container == 'body' ? window.innerHeight : $parent.outerHeight();
					var parentLeft = this.options.container == 'body' ? 0 : $parent.offset().left;

					placement = placement == 'bottom' && pos.top + pos.height + actualHeight - docScroll > parentHeight ? 'top' :
						placement == 'top' && pos.top - docScroll - actualHeight < 0 ? 'bottom' :
						placement == 'right' && pos.right + actualWidth > parentWidth ? 'left' :
						placement == 'left' && pos.left - actualWidth < parentLeft ? 'right' :
						placement;

					$tip
						.removeClass(orgPlacement)
						.addClass(placement);
				}

				var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight);

				this.applyPlacement(calculatedOffset, placement);

			}).call(this.container());
			/*jshint laxcomma: false, eqeqeq: true*/
		}
	});

}(window.jQuery));

/* =========================================================
 * bootstrap-datepicker.js
 * http://www.eyecon.ro/bootstrap-datepicker
 * =========================================================
 * Copyright 2012 Stefan Petre
 * Improvements by Andrew Rowls
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */

(function($) {

	function UTCDate() {
		return new Date(Date.UTC.apply(Date, arguments));
	}

	function UTCToday() {
		var today = new Date();
		return UTCDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
	}

	// Picker object

	var Datepicker = function(element, options) {
		var that = this;

		this._process_options(options);

		this.element = $(element);
		this.isInline = false;
		this.isInput = this.element.is('input');
		this.component = this.element.is('.date') ? this.element.find('.add-on, .btn') : false;
		this.hasInput = this.component && this.element.find('input').length;
		if (this.component && this.component.length === 0)
			this.component = false;

		this.picker = $(DPGlobal.template);
		this._buildEvents();
		this._attachEvents();

		if (this.isInline) {
			this.picker.addClass('datepicker-inline').appendTo(this.element);
		} else {
			this.picker.addClass('datepicker-dropdown dropdown-menu');
		}

		if (this.o.rtl) {
			this.picker.addClass('datepicker-rtl');
			this.picker.find('.prev i, .next i')
				.toggleClass('icon-arrow-left icon-arrow-right');
		}

		this.viewMode = this.o.startView;

		if (this.o.calendarWeeks)
			this.picker.find('tfoot th.today')
			.attr('colspan', function(i, val) {
				return parseInt(val) + 1;
			});

		this._allow_update = false;

		this.setStartDate(this.o.startDate);
		this.setEndDate(this.o.endDate);
		this.setDaysOfWeekDisabled(this.o.daysOfWeekDisabled);

		this.fillDow();
		this.fillMonths();

		this._allow_update = true;

		this.update();
		this.showMode();

		if (this.isInline) {
			this.show();
		}
	};

	Datepicker.prototype = {
		constructor: Datepicker,

		_process_options: function(opts) {
			// Store raw options for reference
			this._o = $.extend({}, this._o, opts);
			// Processed options
			var o = this.o = $.extend({}, this._o);

			// Check if "de-DE" style date is available, if not language should
			// fallback to 2 letter code eg "de"
			var lang = o.language;
			if (!dates[lang]) {
				lang = lang.split('-')[0];
				if (!dates[lang])
					lang = defaults.language;
			}
			o.language = lang;

			switch (o.startView) {
				case 2:
				case 'decade':
					o.startView = 2;
					break;
				case 1:
				case 'year':
					o.startView = 1;
					break;
				default:
					o.startView = 0;
			}

			switch (o.minViewMode) {
				case 1:
				case 'months':
					o.minViewMode = 1;
					break;
				case 2:
				case 'years':
					o.minViewMode = 2;
					break;
				default:
					o.minViewMode = 0;
			}

			o.startView = Math.max(o.startView, o.minViewMode);

			o.weekStart %= 7;
			o.weekEnd = ((o.weekStart + 6) % 7);

			var format = DPGlobal.parseFormat(o.format)
			if (o.startDate !== -Infinity) {
				o.startDate = DPGlobal.parseDate(o.startDate, format, o.language);
			}
			if (o.endDate !== Infinity) {
				o.endDate = DPGlobal.parseDate(o.endDate, format, o.language);
			}

			o.daysOfWeekDisabled = o.daysOfWeekDisabled || [];
			if (!$.isArray(o.daysOfWeekDisabled))
				o.daysOfWeekDisabled = o.daysOfWeekDisabled.split(/[,\s]*/);
			o.daysOfWeekDisabled = $.map(o.daysOfWeekDisabled, function(d) {
				return parseInt(d, 10);
			});
		},
		_events: [],
		_secondaryEvents: [],
		_applyEvents: function(evs) {
			for (var i = 0, el, ev; i < evs.length; i++) {
				el = evs[i][0];
				ev = evs[i][1];
				el.on(ev);
			}
		},
		_unapplyEvents: function(evs) {
			for (var i = 0, el, ev; i < evs.length; i++) {
				el = evs[i][0];
				ev = evs[i][1];
				el.off(ev);
			}
		},
		_buildEvents: function() {
			if (this.isInput) { // single input
				this._events = [
					[this.element, {
						focus: $.proxy(this.show, this),
						keyup: $.proxy(this.update, this),
						keydown: $.proxy(this.keydown, this)
					}]
				];
			} else if (this.component && this.hasInput) { // component: input + button
				this._events = [
					// For components that are not readonly, allow keyboard nav
					[this.element.find('input'), {
						focus: $.proxy(this.show, this),
						keyup: $.proxy(this.update, this),
						keydown: $.proxy(this.keydown, this)
					}],
					[this.component, {
						click: $.proxy(this.show, this)
					}]
				];
			} else if (this.element.is('div')) { // inline datepicker
				this.isInline = true;
			} else {
				this._events = [
					[this.element, {
						click: $.proxy(this.show, this)
					}]
				];
			}

			this._secondaryEvents = [
				[this.picker, {
					click: $.proxy(this.click, this)
				}],
				[$(window), {
					resize: $.proxy(this.place, this)
				}],
				[$(document), {
					mousedown: $.proxy(function(e) {
						// Clicked outside the datepicker, hide it
						if (!(
								this.element.is(e.target) ||
								this.element.find(e.target).size() ||
								this.picker.is(e.target) ||
								this.picker.find(e.target).size()
							)) {
							this.hide();
						}
					}, this)
				}]
			];
		},
		_attachEvents: function() {
			this._detachEvents();
			this._applyEvents(this._events);
		},
		_detachEvents: function() {
			this._unapplyEvents(this._events);
		},
		_attachSecondaryEvents: function() {
			this._detachSecondaryEvents();
			this._applyEvents(this._secondaryEvents);
		},
		_detachSecondaryEvents: function() {
			this._unapplyEvents(this._secondaryEvents);
		},
		_trigger: function(event, altdate) {
			var date = altdate || this.date,
				local_date = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));

			this.element.trigger({
				type: event,
				date: local_date,
				format: $.proxy(function(altformat) {
					var format = altformat || this.o.format;
					return DPGlobal.formatDate(date, format, this.o.language);
				}, this)
			});
		},

		show: function(e) {
			if (!this.isInline)
				this.picker.appendTo('body');
			this.picker.show();
			this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
			this.place();
			this._attachSecondaryEvents();
			if (e) {
				e.preventDefault();
			}
			this._trigger('show');
		},

		hide: function(e) {
			if (this.isInline) return;
			if (!this.picker.is(':visible')) return;
			this.picker.hide().detach();
			this._detachSecondaryEvents();
			this.viewMode = this.o.startView;
			this.showMode();

			if (
				this.o.forceParse &&
				(
					this.isInput && this.element.val() ||
					this.hasInput && this.element.find('input').val()
				)
			)
				this.setValue();
			this._trigger('hide');
		},

		remove: function() {
			this.hide();
			this._detachEvents();
			this._detachSecondaryEvents();
			this.picker.remove();
			delete this.element.data().datepicker;
			if (!this.isInput) {
				delete this.element.data().date;
			}
		},

		getDate: function() {
			var d = this.getUTCDate();
			return new Date(d.getTime() + (d.getTimezoneOffset() * 60000));
		},

		getUTCDate: function() {
			return this.date;
		},

		setDate: function(d) {
			this.setUTCDate(new Date(d.getTime() - (d.getTimezoneOffset() * 60000)));
		},

		setUTCDate: function(d) {
			this.date = d;
			this.setValue();
		},

		setValue: function() {
			var formatted = this.getFormattedDate();
			if (!this.isInput) {
				if (this.component) {
					this.element.find('input').val(formatted);
				}
			} else {
				this.element.val(formatted);
			}
		},

		getFormattedDate: function(format) {
			if (format === undefined)
				format = this.o.format;
			return DPGlobal.formatDate(this.date, format, this.o.language);
		},

		setStartDate: function(startDate) {
			this._process_options({
				startDate: startDate
			});
			this.update();
			this.updateNavArrows();
		},

		setEndDate: function(endDate) {
			this._process_options({
				endDate: endDate
			});
			this.update();
			this.updateNavArrows();
		},

		setDaysOfWeekDisabled: function(daysOfWeekDisabled) {
			this._process_options({
				daysOfWeekDisabled: daysOfWeekDisabled
			});
			this.update();
			this.updateNavArrows();
		},

		place: function() {
			if (this.isInline) return;
			var zIndex = parseInt(this.element.parents().filter(function() {
				return $(this).css('z-index') != 'auto';
			}).first().css('z-index')) + 10;
			var offset = this.component ? this.component.parent().offset() : this.element.offset();
			var height = this.component ? this.component.outerHeight(true) : this.element.outerHeight(true);
			this.picker.css({
				top: offset.top + height,
				left: offset.left,
				zIndex: zIndex
			});
		},

		_allow_update: true,
		update: function() {
			if (!this._allow_update) return;

			var date, fromArgs = false;
			if (arguments && arguments.length && (typeof arguments[0] === 'string' || arguments[0] instanceof Date)) {
				date = arguments[0];
				fromArgs = true;
			} else {
				date = this.isInput ? this.element.val() : this.element.data('date') || this.element.find('input').val();
				delete this.element.data().date;
			}

			this.date = DPGlobal.parseDate(date, this.o.format, this.o.language);

			if (fromArgs) this.setValue();

			if (this.date < this.o.startDate) {
				this.viewDate = new Date(this.o.startDate);
			} else if (this.date > this.o.endDate) {
				this.viewDate = new Date(this.o.endDate);
			} else {
				this.viewDate = new Date(this.date);
			}
			this.fill();
		},

		fillDow: function() {
			var dowCnt = this.o.weekStart,
				html = '<tr>';
			if (this.o.calendarWeeks) {
				var cell = '<th class="cw">&nbsp;</th>';
				html += cell;
				this.picker.find('.datepicker-days thead tr:first-child').prepend(cell);
			}
			while (dowCnt < this.o.weekStart + 7) {
				html += '<th class="dow">' + dates[this.o.language].daysMin[(dowCnt++) % 7] + '</th>';
			}
			html += '</tr>';
			this.picker.find('.datepicker-days thead').append(html);
		},

		fillMonths: function() {
			var html = '',
				i = 0;
			while (i < 12) {
				html += '<span class="month">' + dates[this.o.language].monthsShort[i++] + '</span>';
			}
			this.picker.find('.datepicker-months td').html(html);
		},

		setRange: function(range) {
			if (!range || !range.length)
				delete this.range;
			else
				this.range = $.map(range, function(d) {
					return d.valueOf();
				});
			this.fill();
		},

		getClassNames: function(date) {
			var cls = [],
				year = this.viewDate.getUTCFullYear(),
				month = this.viewDate.getUTCMonth(),
				currentDate = this.date.valueOf(),
				today = new Date();
			if (date.getUTCFullYear() < year || (date.getUTCFullYear() == year && date.getUTCMonth() < month)) {
				cls.push('old');
			} else if (date.getUTCFullYear() > year || (date.getUTCFullYear() == year && date.getUTCMonth() > month)) {
				cls.push('new');
			}
			// Compare internal UTC date with local today, not UTC today
			if (this.o.todayHighlight &&
				date.getUTCFullYear() == today.getFullYear() &&
				date.getUTCMonth() == today.getMonth() &&
				date.getUTCDate() == today.getDate()) {
				cls.push('today');
			}
			if (currentDate && date.valueOf() == currentDate) {
				cls.push('active');
			}
			if (date.valueOf() < this.o.startDate || date.valueOf() > this.o.endDate ||
				$.inArray(date.getUTCDay(), this.o.daysOfWeekDisabled) !== -1) {
				cls.push('disabled');
			}
			if (this.range) {
				if (date > this.range[0] && date < this.range[this.range.length - 1]) {
					cls.push('range');
				}
				if ($.inArray(date.valueOf(), this.range) != -1) {
					cls.push('selected');
				}
			}
			return cls;
		},

		fill: function() {
			var d = new Date(this.viewDate),
				year = d.getUTCFullYear(),
				month = d.getUTCMonth(),
				startYear = this.o.startDate !== -Infinity ? this.o.startDate.getUTCFullYear() : -Infinity,
				startMonth = this.o.startDate !== -Infinity ? this.o.startDate.getUTCMonth() : -Infinity,
				endYear = this.o.endDate !== Infinity ? this.o.endDate.getUTCFullYear() : Infinity,
				endMonth = this.o.endDate !== Infinity ? this.o.endDate.getUTCMonth() : Infinity,
				currentDate = this.date && this.date.valueOf(),
				tooltip;
			this.picker.find('.datepicker-days thead th.datepicker-switch')
				.text(dates[this.o.language].months[month] + ' ' + year);
			this.picker.find('tfoot th.today')
				.text(dates[this.o.language].today)
				.toggle(this.o.todayBtn !== false);
			this.picker.find('tfoot th.clear')
				.text(dates[this.o.language].clear)
				.toggle(this.o.clearBtn !== false);
			this.updateNavArrows();
			this.fillMonths();
			var prevMonth = UTCDate(year, month - 1, 28, 0, 0, 0, 0),
				day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
			prevMonth.setUTCDate(day);
			prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.o.weekStart + 7) % 7);
			var nextMonth = new Date(prevMonth);
			nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
			nextMonth = nextMonth.valueOf();
			var html = [];
			var clsName;
			while (prevMonth.valueOf() < nextMonth) {
				if (prevMonth.getUTCDay() == this.o.weekStart) {
					html.push('<tr>');
					if (this.o.calendarWeeks) {
						// ISO 8601: First week contains first thursday.
						// ISO also states week starts on Monday, but we can be more abstract here.
						var
						// Start of current week: based on weekstart/current date
							ws = new Date(+prevMonth + (this.o.weekStart - prevMonth.getUTCDay() - 7) % 7 * 864e5),
							// Thursday of this week
							th = new Date(+ws + (7 + 4 - ws.getUTCDay()) % 7 * 864e5),
							// First Thursday of year, year from thursday
							yth = new Date(+(yth = UTCDate(th.getUTCFullYear(), 0, 1)) + (7 + 4 - yth.getUTCDay()) % 7 * 864e5),
							// Calendar week: ms between thursdays, div ms per day, div 7 days
							calWeek = (th - yth) / 864e5 / 7 + 1;
						html.push('<td class="cw">' + calWeek + '</td>');

					}
				}
				clsName = this.getClassNames(prevMonth);
				clsName.push('day');

				var before = this.o.beforeShowDay(prevMonth);
				if (before === undefined)
					before = {};
				else if (typeof(before) === 'boolean')
					before = {
						enabled: before
					};
				else if (typeof(before) === 'string')
					before = {
						classes: before
					};
				if (before.enabled === false)
					clsName.push('disabled');
				if (before.classes)
					clsName = clsName.concat(before.classes.split(/\s+/));
				if (before.tooltip)
					tooltip = before.tooltip;

				clsName = $.unique(clsName);
				html.push('<td class="' + clsName.join(' ') + '"' + (tooltip ? ' title="' + tooltip + '"' : '') + '>' + prevMonth.getUTCDate() + '</td>');
				if (prevMonth.getUTCDay() == this.o.weekEnd) {
					html.push('</tr>');
				}
				prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);
			}
			this.picker.find('.datepicker-days tbody').empty().append(html.join(''));
			var currentYear = this.date && this.date.getUTCFullYear();

			var months = this.picker.find('.datepicker-months')
				.find('th:eq(1)')
				.text(year)
				.end()
				.find('span').removeClass('active');
			if (currentYear && currentYear == year) {
				months.eq(this.date.getUTCMonth()).addClass('active');
			}
			if (year < startYear || year > endYear) {
				months.addClass('disabled');
			}
			if (year == startYear) {
				months.slice(0, startMonth).addClass('disabled');
			}
			if (year == endYear) {
				months.slice(endMonth + 1).addClass('disabled');
			}

			html = '';
			year = parseInt(year / 10, 10) * 10;
			var yearCont = this.picker.find('.datepicker-years')
				.find('th:eq(1)')
				.text(year + '-' + (year + 9))
				.end()
				.find('td');
			year -= 1;
			for (var i = -1; i < 11; i++) {
				html += '<span class="year' + (i == -1 ? ' old' : i == 10 ? ' new' : '') + (currentYear == year ? ' active' : '') + (year < startYear || year > endYear ? ' disabled' : '') + '">' + year + '</span>';
				year += 1;
			}
			yearCont.html(html);
		},

		updateNavArrows: function() {
			if (!this._allow_update) return;

			var d = new Date(this.viewDate),
				year = d.getUTCFullYear(),
				month = d.getUTCMonth();
			switch (this.viewMode) {
				case 0:
					if (this.o.startDate !== -Infinity && year <= this.o.startDate.getUTCFullYear() && month <= this.o.startDate.getUTCMonth()) {
						this.picker.find('.prev').css({
							visibility: 'hidden'
						});
					} else {
						this.picker.find('.prev').css({
							visibility: 'visible'
						});
					}
					if (this.o.endDate !== Infinity && year >= this.o.endDate.getUTCFullYear() && month >= this.o.endDate.getUTCMonth()) {
						this.picker.find('.next').css({
							visibility: 'hidden'
						});
					} else {
						this.picker.find('.next').css({
							visibility: 'visible'
						});
					}
					break;
				case 1:
				case 2:
					if (this.o.startDate !== -Infinity && year <= this.o.startDate.getUTCFullYear()) {
						this.picker.find('.prev').css({
							visibility: 'hidden'
						});
					} else {
						this.picker.find('.prev').css({
							visibility: 'visible'
						});
					}
					if (this.o.endDate !== Infinity && year >= this.o.endDate.getUTCFullYear()) {
						this.picker.find('.next').css({
							visibility: 'hidden'
						});
					} else {
						this.picker.find('.next').css({
							visibility: 'visible'
						});
					}
					break;
			}
		},

		click: function(e) {
			e.preventDefault();
			var target = $(e.target).closest('span, td, th');
			if (target.length == 1) {
				switch (target[0].nodeName.toLowerCase()) {
					case 'th':
						switch (target[0].className) {
							case 'datepicker-switch':
								this.showMode(1);
								break;
							case 'prev':
							case 'next':
								var dir = DPGlobal.modes[this.viewMode].navStep * (target[0].className == 'prev' ? -1 : 1);
								switch (this.viewMode) {
									case 0:
										this.viewDate = this.moveMonth(this.viewDate, dir);
										break;
									case 1:
									case 2:
										this.viewDate = this.moveYear(this.viewDate, dir);
										break;
								}
								this.fill();
								break;
							case 'today':
								var date = new Date();
								date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);

								this.showMode(-2);
								var which = this.o.todayBtn == 'linked' ? null : 'view';
								this._setDate(date, which);
								break;
							case 'clear':
								var element;
								if (this.isInput)
									element = this.element;
								else if (this.component)
									element = this.element.find('input');
								if (element)
									element.val("").change();
								this._trigger('changeDate');
								this.update();
								if (this.o.autoclose)
									this.hide();
								break;
						}
						break;
					case 'span':
						if (!target.is('.disabled')) {
							this.viewDate.setUTCDate(1);
							if (target.is('.month')) {
								var day = 1;
								var month = target.parent().find('span').index(target);
								var year = this.viewDate.getUTCFullYear();
								this.viewDate.setUTCMonth(month);
								this._trigger('changeMonth', this.viewDate);
								if (this.o.minViewMode === 1) {
									this._setDate(UTCDate(year, month, day, 0, 0, 0, 0));
								}
							} else {
								var year = parseInt(target.text(), 10) || 0;
								var day = 1;
								var month = 0;
								this.viewDate.setUTCFullYear(year);
								this._trigger('changeYear', this.viewDate);
								if (this.o.minViewMode === 2) {
									this._setDate(UTCDate(year, month, day, 0, 0, 0, 0));
								}
							}
							this.showMode(-1);
							this.fill();
						}
						break;
					case 'td':
						if (target.is('.day') && !target.is('.disabled')) {
							var day = parseInt(target.text(), 10) || 1;
							var year = this.viewDate.getUTCFullYear(),
								month = this.viewDate.getUTCMonth();
							if (target.is('.old')) {
								if (month === 0) {
									month = 11;
									year -= 1;
								} else {
									month -= 1;
								}
							} else if (target.is('.new')) {
								if (month == 11) {
									month = 0;
									year += 1;
								} else {
									month += 1;
								}
							}
							this._setDate(UTCDate(year, month, day, 0, 0, 0, 0));
						}
						break;
				}
			}
		},

		_setDate: function(date, which) {
			if (!which || which == 'date')
				this.date = new Date(date);
			if (!which || which == 'view')
				this.viewDate = new Date(date);
			this.fill();
			this.setValue();
			this._trigger('changeDate');
			var element;
			if (this.isInput) {
				element = this.element;
			} else if (this.component) {
				element = this.element.find('input');
			}
			if (element) {
				element.change();
				if (this.o.autoclose && (!which || which == 'date')) {
					this.hide();
				}
			}
		},

		moveMonth: function(date, dir) {
			if (!dir) return date;
			var new_date = new Date(date.valueOf()),
				day = new_date.getUTCDate(),
				month = new_date.getUTCMonth(),
				mag = Math.abs(dir),
				new_month, test;
			dir = dir > 0 ? 1 : -1;
			if (mag == 1) {
				test = dir == -1
					// If going back one month, make sure month is not current month
					// (eg, Mar 31 -> Feb 31 == Feb 28, not Mar 02)
					? function() {
						return new_date.getUTCMonth() == month;
					}
					// If going forward one month, make sure month is as expected
					// (eg, Jan 31 -> Feb 31 == Feb 28, not Mar 02)
					: function() {
						return new_date.getUTCMonth() != new_month;
					};
				new_month = month + dir;
				new_date.setUTCMonth(new_month);
				// Dec -> Jan (12) or Jan -> Dec (-1) -- limit expected date to 0-11
				if (new_month < 0 || new_month > 11)
					new_month = (new_month + 12) % 12;
			} else {
				// For magnitudes >1, move one month at a time...
				for (var i = 0; i < mag; i++)
				// ...which might decrease the day (eg, Jan 31 to Feb 28, etc)...
					new_date = this.moveMonth(new_date, dir);
				// ...then reset the day, keeping it in the new month
				new_month = new_date.getUTCMonth();
				new_date.setUTCDate(day);
				test = function() {
					return new_month != new_date.getUTCMonth();
				};
			}
			// Common date-resetting loop -- if date is beyond end of month, make it
			// end of month
			while (test()) {
				new_date.setUTCDate(--day);
				new_date.setUTCMonth(new_month);
			}
			return new_date;
		},

		moveYear: function(date, dir) {
			return this.moveMonth(date, dir * 12);
		},

		dateWithinRange: function(date) {
			return date >= this.o.startDate && date <= this.o.endDate;
		},

		keydown: function(e) {
			if (this.picker.is(':not(:visible)')) {
				if (e.keyCode == 27) // allow escape to hide and re-show picker
					this.show();
				return;
			}
			var dateChanged = false,
				dir, day, month,
				newDate, newViewDate;
			switch (e.keyCode) {
				case 27: // escape
					this.hide();
					e.preventDefault();
					break;
				case 37: // left
				case 39: // right
					if (!this.o.keyboardNavigation) break;
					dir = e.keyCode == 37 ? -1 : 1;
					if (e.ctrlKey) {
						newDate = this.moveYear(this.date, dir);
						newViewDate = this.moveYear(this.viewDate, dir);
					} else if (e.shiftKey) {
						newDate = this.moveMonth(this.date, dir);
						newViewDate = this.moveMonth(this.viewDate, dir);
					} else {
						newDate = new Date(this.date);
						newDate.setUTCDate(this.date.getUTCDate() + dir);
						newViewDate = new Date(this.viewDate);
						newViewDate.setUTCDate(this.viewDate.getUTCDate() + dir);
					}
					if (this.dateWithinRange(newDate)) {
						this.date = newDate;
						this.viewDate = newViewDate;
						this.setValue();
						this.update();
						e.preventDefault();
						dateChanged = true;
					}
					break;
				case 38: // up
				case 40: // down
					if (!this.o.keyboardNavigation) break;
					dir = e.keyCode == 38 ? -1 : 1;
					if (e.ctrlKey) {
						newDate = this.moveYear(this.date, dir);
						newViewDate = this.moveYear(this.viewDate, dir);
					} else if (e.shiftKey) {
						newDate = this.moveMonth(this.date, dir);
						newViewDate = this.moveMonth(this.viewDate, dir);
					} else {
						newDate = new Date(this.date);
						newDate.setUTCDate(this.date.getUTCDate() + dir * 7);
						newViewDate = new Date(this.viewDate);
						newViewDate.setUTCDate(this.viewDate.getUTCDate() + dir * 7);
					}
					if (this.dateWithinRange(newDate)) {
						this.date = newDate;
						this.viewDate = newViewDate;
						this.setValue();
						this.update();
						e.preventDefault();
						dateChanged = true;
					}
					break;
				case 13: // enter
					this.hide();
					e.preventDefault();
					break;
				case 9: // tab
					this.hide();
					break;
			}
			if (dateChanged) {
				this._trigger('changeDate');
				var element;
				if (this.isInput) {
					element = this.element;
				} else if (this.component) {
					element = this.element.find('input');
				}
				if (element) {
					element.change();
				}
			}
		},

		showMode: function(dir) {
			if (dir) {
				this.viewMode = Math.max(this.o.minViewMode, Math.min(2, this.viewMode + dir));
			}
			/*
				vitalets: fixing bug of very special conditions:
				jquery 1.7.1 + webkit + show inline datepicker in bootstrap popover.
				Method show() does not set display css correctly and datepicker is not shown.
				Changed to .css('display', 'block') solve the problem.
				See https://github.com/vitalets/x-editable/issues/37

				In jquery 1.7.2+ everything works fine.
			*/
			//this.picker.find('>div').hide().filter('.datepicker-'+DPGlobal.modes[this.viewMode].clsName).show();
			this.picker.find('>div').hide().filter('.datepicker-' + DPGlobal.modes[this.viewMode].clsName).css('display', 'block');
			this.updateNavArrows();
		}
	};

	var DateRangePicker = function(element, options) {
		this.element = $(element);
		this.inputs = $.map(options.inputs, function(i) {
			return i.jquery ? i[0] : i;
		});
		delete options.inputs;

		$(this.inputs)
			.datepicker(options)
			.bind('changeDate', $.proxy(this.dateUpdated, this));

		this.pickers = $.map(this.inputs, function(i) {
			return $(i).data('datepicker');
		});
		this.updateDates();
	};
	DateRangePicker.prototype = {
		updateDates: function() {
			this.dates = $.map(this.pickers, function(i) {
				return i.date;
			});
			this.updateRanges();
		},
		updateRanges: function() {
			var range = $.map(this.dates, function(d) {
				return d.valueOf();
			});
			$.each(this.pickers, function(i, p) {
				p.setRange(range);
			});
		},
		dateUpdated: function(e) {
			var dp = $(e.target).data('datepicker'),
				new_date = dp.getUTCDate(),
				i = $.inArray(e.target, this.inputs),
				l = this.inputs.length;
			if (i == -1) return;

			if (new_date < this.dates[i]) {
				// Date being moved earlier/left
				while (i >= 0 && new_date < this.dates[i]) {
					this.pickers[i--].setUTCDate(new_date);
				}
			} else if (new_date > this.dates[i]) {
				// Date being moved later/right
				while (i < l && new_date > this.dates[i]) {
					this.pickers[i++].setUTCDate(new_date);
				}
			}
			this.updateDates();
		},
		remove: function() {
			$.map(this.pickers, function(p) {
				p.remove();
			});
			delete this.element.data().datepicker;
		}
	};

	function opts_from_el(el, prefix) {
		// Derive options from element data-attrs
		var data = $(el).data(),
			out = {},
			inkey,
			replace = new RegExp('^' + prefix.toLowerCase() + '([A-Z])'),
			prefix = new RegExp('^' + prefix.toLowerCase());
		for (var key in data)
			if (prefix.test(key)) {
				inkey = key.replace(replace, function(_, a) {
					return a.toLowerCase();
				});
				out[inkey] = data[key];
			}
		return out;
	}

	function opts_from_locale(lang) {
		// Derive options from locale plugins
		var out = {};
		// Check if "de-DE" style date is available, if not language should
		// fallback to 2 letter code eg "de"
		if (!dates[lang]) {
			lang = lang.split('-')[0]
			if (!dates[lang])
				return;
		}
		var d = dates[lang];
		$.each(locale_opts, function(i, k) {
			if (k in d)
				out[k] = d[k];
		});
		return out;
	}

	var old = $.fn.datepicker;
	var datepicker = $.fn.datepicker = function(option) {
		var args = Array.apply(null, arguments);
		args.shift();
		var internal_return,
			this_return;
		this.each(function() {
			var $this = $(this),
				data = $this.data('datepicker'),
				options = typeof option == 'object' && option;
			if (!data) {
				var elopts = opts_from_el(this, 'date'),
					// Preliminary otions
					xopts = $.extend({}, defaults, elopts, options),
					locopts = opts_from_locale(xopts.language),
					// Options priority: js args, data-attrs, locales, defaults
					opts = $.extend({}, defaults, locopts, elopts, options);
				if ($this.is('.input-daterange') || opts.inputs) {
					var ropts = {
						inputs: opts.inputs || $this.find('input').toArray()
					};
					$this.data('datepicker', (data = new DateRangePicker(this, $.extend(opts, ropts))));
				} else {
					$this.data('datepicker', (data = new Datepicker(this, opts)));
				}
			}
			if (typeof option == 'string' && typeof data[option] == 'function') {
				internal_return = data[option].apply(data, args);
				if (internal_return !== undefined)
					return false;
			}
		});
		if (internal_return !== undefined)
			return internal_return;
		else
			return this;
	};

	var defaults = $.fn.datepicker.defaults = {
		autoclose: false,
		beforeShowDay: $.noop,
		calendarWeeks: false,
		clearBtn: false,
		daysOfWeekDisabled: [],
		endDate: Infinity,
		forceParse: true,
		format: 'mm/dd/yyyy',
		keyboardNavigation: true,
		language: 'en',
		minViewMode: 0,
		rtl: false,
		startDate: -Infinity,
		startView: 0,
		todayBtn: false,
		todayHighlight: false,
		weekStart: 0
	};
	var locale_opts = $.fn.datepicker.locale_opts = [
		'format',
		'rtl',
		'weekStart'
	];
	$.fn.datepicker.Constructor = Datepicker;
	var dates = $.fn.datepicker.dates = {
		en: {
			days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
			daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
			months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			today: "Today",
			clear: "Clear"
		}
	};

	var DPGlobal = {
		modes: [{
			clsName: 'days',
			navFnc: 'Month',
			navStep: 1
		}, {
			clsName: 'months',
			navFnc: 'FullYear',
			navStep: 1
		}, {
			clsName: 'years',
			navFnc: 'FullYear',
			navStep: 10
		}],
		isLeapYear: function(year) {
			return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
		},
		getDaysInMonth: function(year, month) {
			return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
		},
		validParts: /dd?|DD?|mm?|MM?|yy(?:yy)?/g,
		nonpunctuation: /[^ -\/:-@\[\u3400-\u9fff-`{-~\t\n\r]+/g,
		parseFormat: function(format) {
			// IE treats \0 as a string end in inputs (truncating the value),
			// so it's a bad format delimiter, anyway
			var separators = format.replace(this.validParts, '\0').split('\0'),
				parts = format.match(this.validParts);
			if (!separators || !separators.length || !parts || parts.length === 0) {
				throw new Error("Invalid date format.");
			}
			return {
				separators: separators,
				parts: parts
			};
		},
		parseDate: function(date, format, language) {
			if (date instanceof Date) return date;
			if (typeof format === 'string')
				format = DPGlobal.parseFormat(format);
			if (/^[\-+]\d+[dmwy]([\s,]+[\-+]\d+[dmwy])*$/.test(date)) {
				var part_re = /([\-+]\d+)([dmwy])/,
					parts = date.match(/([\-+]\d+)([dmwy])/g),
					part, dir;
				date = new Date();
				for (var i = 0; i < parts.length; i++) {
					part = part_re.exec(parts[i]);
					dir = parseInt(part[1]);
					switch (part[2]) {
						case 'd':
							date.setUTCDate(date.getUTCDate() + dir);
							break;
						case 'm':
							date = Datepicker.prototype.moveMonth.call(Datepicker.prototype, date, dir);
							break;
						case 'w':
							date.setUTCDate(date.getUTCDate() + dir * 7);
							break;
						case 'y':
							date = Datepicker.prototype.moveYear.call(Datepicker.prototype, date, dir);
							break;
					}
				}
				return UTCDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
			}
			var parts = date && date.match(this.nonpunctuation) || [],
				date = new Date(),
				parsed = {},
				setters_order = ['yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'd', 'dd'],
				setters_map = {
					yyyy: function(d, v) {
						return d.setUTCFullYear(v);
					},
					yy: function(d, v) {
						return d.setUTCFullYear(2000 + v);
					},
					m: function(d, v) {
						v -= 1;
						while (v < 0) v += 12;
						v %= 12;
						d.setUTCMonth(v);
						while (d.getUTCMonth() != v)
							d.setUTCDate(d.getUTCDate() - 1);
						return d;
					},
					d: function(d, v) {
						return d.setUTCDate(v);
					}
				},
				val, filtered, part;
			setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
			setters_map['dd'] = setters_map['d'];
			date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
			var fparts = format.parts.slice();
			// Remove noop parts
			if (parts.length != fparts.length) {
				fparts = $(fparts).filter(function(i, p) {
					return $.inArray(p, setters_order) !== -1;
				}).toArray();
			}
			// Process remainder
			if (parts.length == fparts.length) {
				for (var i = 0, cnt = fparts.length; i < cnt; i++) {
					val = parseInt(parts[i], 10);
					part = fparts[i];
					if (isNaN(val)) {
						switch (part) {
							case 'MM':
								filtered = $(dates[language].months).filter(function() {
									var m = this.slice(0, parts[i].length),
										p = parts[i].slice(0, m.length);
									return m == p;
								});
								val = $.inArray(filtered[0], dates[language].months) + 1;
								break;
							case 'M':
								filtered = $(dates[language].monthsShort).filter(function() {
									var m = this.slice(0, parts[i].length),
										p = parts[i].slice(0, m.length);
									return m == p;
								});
								val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
								break;
						}
					}
					parsed[part] = val;
				}
				for (var i = 0, s; i < setters_order.length; i++) {
					s = setters_order[i];
					if (s in parsed && !isNaN(parsed[s]))
						setters_map[s](date, parsed[s]);
				}
			}
			return date;
		},
		formatDate: function(date, format, language) {
			if (typeof format === 'string')
				format = DPGlobal.parseFormat(format);
			var val = {
				d: date.getUTCDate(),
				D: dates[language].daysShort[date.getUTCDay()],
				DD: dates[language].days[date.getUTCDay()],
				m: date.getUTCMonth() + 1,
				M: dates[language].monthsShort[date.getUTCMonth()],
				MM: dates[language].months[date.getUTCMonth()],
				yy: date.getUTCFullYear().toString().substring(2),
				yyyy: date.getUTCFullYear()
			};
			val.dd = (val.d < 10 ? '0' : '') + val.d;
			val.mm = (val.m < 10 ? '0' : '') + val.m;
			var date = [],
				seps = $.extend([], format.separators);
			for (var i = 0, cnt = format.parts.length; i <= cnt; i++) {
				if (seps.length)
					date.push(seps.shift());
				date.push(val[format.parts[i]]);
			}
			return date.join('');
		},
		headTemplate: '<thead>' +
			'<tr>' +
			'<th class="prev"><i class="icon-arrow-left"/></th>' +
			'<th colspan="5" class="datepicker-switch"></th>' +
			'<th class="next"><i class="icon-arrow-right"/></th>' +
			'</tr>' +
			'</thead>',
		contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>',
		footTemplate: '<tfoot><tr><th colspan="7" class="today"></th></tr><tr><th colspan="7" class="clear"></th></tr></tfoot>'
	};
	DPGlobal.template = '<div class="datepicker">' +
		'<div class="datepicker-days">' +
		'<table class=" table-condensed">' +
		DPGlobal.headTemplate +
		'<tbody></tbody>' +
		DPGlobal.footTemplate +
		'</table>' +
		'</div>' +
		'<div class="datepicker-months">' +
		'<table class="table-condensed">' +
		DPGlobal.headTemplate +
		DPGlobal.contTemplate +
		DPGlobal.footTemplate +
		'</table>' +
		'</div>' +
		'<div class="datepicker-years">' +
		'<table class="table-condensed">' +
		DPGlobal.headTemplate +
		DPGlobal.contTemplate +
		DPGlobal.footTemplate +
		'</table>' +
		'</div>' +
		'</div>';

	$.fn.datepicker.DPGlobal = DPGlobal;

	/* DATEPICKER NO CONFLICT
	 * =================== */

	$.fn.datepicker.noConflict = function() {
		$.fn.datepicker = old;
		return this;
	};

	/* DATEPICKER DATA-API
	 * ================== */

	$(document).on(
		'focus.datepicker.data-api click.datepicker.data-api',
		'[data-provide="datepicker"]',
		function(e) {
			var $this = $(this);
			if ($this.data('datepicker')) return;
			e.preventDefault();
			// component click requires us to explicitly show it
			datepicker.call($this, 'show');
		}
	);
	$(function() {
		//$('[data-provide="datepicker-inline"]').datepicker();
		//vit: changed to support noConflict()
		datepicker.call($('[data-provide="datepicker-inline"]'));
	});

}(window.jQuery));

/**
Bootstrap-datepicker.  
Description and examples: https://github.com/eternicode/bootstrap-datepicker.  
For **i18n** you should include js file from here: https://github.com/eternicode/bootstrap-datepicker/tree/master/js/locales
and set `language` option.  
Since 1.4.0 date has different appearance in **popup** and **inline** modes. 

@class date
@extends abstractinput
@final
@example
<a href="#" id="dob" data-type="date" data-pk="1" data-url="/post" data-title="Select date">15/05/1984</a>
<script>
$(function(){
    $('#dob').editable({
        format: 'yyyy-mm-dd',    
        viewformat: 'dd/mm/yyyy',    
        datepicker: {
                weekStart: 1
           }
        }
    });
});
</script>
**/
(function($) {
	"use strict";

	//store bootstrap-datepicker as bdateicker to exclude conflict with jQuery UI one
	$.fn.bdatepicker = $.fn.datepicker.noConflict();
	if (!$.fn.datepicker) { //if there were no other datepickers, keep also original name
		$.fn.datepicker = $.fn.bdatepicker;
	}

	var Date = function(options) {
		this.init('date', options, Date.defaults);
		this.initPicker(options, Date.defaults);
	};

	$.fn.editableutils.inherit(Date, $.fn.editabletypes.abstractinput);

	$.extend(Date.prototype, {
		initPicker: function(options, defaults) {
			//'format' is set directly from settings or data-* attributes

			//by default viewformat equals to format
			if (!this.options.viewformat) {
				this.options.viewformat = this.options.format;
			}

			//try parse datepicker config defined as json string in data-datepicker
			options.datepicker = $.fn.editableutils.tryParseJson(options.datepicker, true);

			//overriding datepicker config (as by default jQuery extend() is not recursive)
			//since 1.4 datepicker internally uses viewformat instead of format. Format is for submit only
			this.options.datepicker = $.extend({}, defaults.datepicker, options.datepicker, {
				format: this.options.viewformat
			});

			//language
			this.options.datepicker.language = this.options.datepicker.language || 'en';

			//store DPglobal
			this.dpg = $.fn.bdatepicker.DPGlobal;

			//store parsed formats
			this.parsedFormat = this.dpg.parseFormat(this.options.format);
			this.parsedViewFormat = this.dpg.parseFormat(this.options.viewformat);
		},

		render: function() {
			this.$input.bdatepicker(this.options.datepicker);

			//"clear" link
			if (this.options.clear) {
				this.$clear = $('<a href="#"></a>').html(this.options.clear).click($.proxy(function(e) {
					e.preventDefault();
					e.stopPropagation();
					this.clear();
				}, this));

				this.$tpl.parent().append($('<div class="editable-clear">').append(this.$clear));
			}
		},

		value2html: function(value, element) {
			var text = value ? this.dpg.formatDate(value, this.parsedViewFormat, this.options.datepicker.language) : '';
			Date.superclass.value2html.call(this, text, element);
		},

		html2value: function(html) {
			return this.parseDate(html, this.parsedViewFormat);
		},

		value2str: function(value) {
			return value ? this.dpg.formatDate(value, this.parsedFormat, this.options.datepicker.language) : '';
		},

		str2value: function(str) {
			return this.parseDate(str, this.parsedFormat);
		},

		value2submit: function(value) {
			return this.value2str(value);
		},

		value2input: function(value) {
			this.$input.bdatepicker('update', value);
		},

		input2value: function() {
			return this.$input.data('datepicker').date;
		},

		activate: function() {},

		clear: function() {
			this.$input.data('datepicker').date = null;
			this.$input.find('.active').removeClass('active');
			if (!this.options.showbuttons) {
				this.$input.closest('form').submit();
			}
		},

		autosubmit: function() {
			this.$input.on('mouseup', '.day', function(e) {
				if ($(e.currentTarget).is('.old') || $(e.currentTarget).is('.new')) {
					return;
				}
				var $form = $(this).closest('form');
				setTimeout(function() {
					$form.submit();
				}, 200);
			});
			//changedate is not suitable as it triggered when showing datepicker. see #149
			/*
			this.$input.on('changeDate', function(e){
			    var $form = $(this).closest('form');
			    setTimeout(function() {
			        $form.submit();
			    }, 200);
			});
			*/
		},

		/*
		 For incorrect date bootstrap-datepicker returns current date that is not suitable
		 for datefield.
		 This function returns null for incorrect date.  
		*/
		parseDate: function(str, format) {
			var date = null,
				formattedBack;
			if (str) {
				date = this.dpg.parseDate(str, format, this.options.datepicker.language);
				if (typeof str === 'string') {
					formattedBack = this.dpg.formatDate(date, format, this.options.datepicker.language);
					if (str !== formattedBack) {
						date = null;
					}
				}
			}
			return date;
		}

	});

	Date.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
		/**
		@property tpl 
		@default <div></div>
		**/
		tpl: '<div class="editable-date well"></div>',
		/**
		@property inputclass 
		@default null
		**/
		inputclass: null,
		/**
		Format used for sending value to server. Also applied when converting date from <code>data-value</code> attribute.<br>
		Possible tokens are: <code>d, dd, m, mm, yy, yyyy</code>  

		@property format 
		@type string
		@default yyyy-mm-dd
		**/
		format: 'yyyy-mm-dd',
		/**
		Format used for displaying date. Also applied when converting date from element's text on init.   
		If not specified equals to <code>format</code>

		@property viewformat 
		@type string
		@default null
		**/
		viewformat: null,
		/**
		Configuration of datepicker.
		Full list of options: http://bootstrap-datepicker.readthedocs.org/en/latest/options.html

		@property datepicker 
		@type object
		@default {
		    weekStart: 0,
		    startView: 0,
		    minViewMode: 0,
		    autoclose: false
		}
		**/
		datepicker: {
			weekStart: 0,
			startView: 0,
			minViewMode: 0,
			autoclose: false
		},
		/**
		Text shown as clear date button. 
		If <code>false</code> clear button will not be rendered.

		@property clear 
		@type boolean|string
		@default 'x clear'
		**/
		clear: '&times; clear'
	});

	$.fn.editabletypes.date = Date;

}(window.jQuery));

/**
Bootstrap datefield input - modification for inline mode.
Shows normal <input type="text"> and binds popup datepicker.  
Automatically shown in inline mode.

@class datefield
@extends date

@since 1.4.0
**/
(function($) {
	"use strict";

	var DateField = function(options) {
		this.init('datefield', options, DateField.defaults);
		this.initPicker(options, DateField.defaults);
	};

	$.fn.editableutils.inherit(DateField, $.fn.editabletypes.date);

	$.extend(DateField.prototype, {
		render: function() {
			this.$input = this.$tpl.find('input');
			this.setClass();
			this.setAttr('placeholder');

			//bootstrap-datepicker is set `bdateicker` to exclude conflict with jQuery UI one. (in date.js)        
			this.$tpl.bdatepicker(this.options.datepicker);

			//need to disable original event handlers
			this.$input.off('focus keydown');

			//update value of datepicker
			this.$input.keyup($.proxy(function() {
				this.$tpl.removeData('date');
				this.$tpl.bdatepicker('update');
			}, this));

		},

		value2input: function(value) {
			this.$input.val(value ? this.dpg.formatDate(value, this.parsedViewFormat, this.options.datepicker.language) : '');
			this.$tpl.bdatepicker('update');
		},

		input2value: function() {
			return this.html2value(this.$input.val());
		},

		activate: function() {
			$.fn.editabletypes.text.prototype.activate.call(this);
		},

		autosubmit: function() {
			//reset autosubmit to empty  
		}
	});

	DateField.defaults = $.extend({}, $.fn.editabletypes.date.defaults, {
		/**
		@property tpl 
		**/
		tpl: '<div class="input-append date"><input type="text"/><span class="add-on"><i class="icon-th"></i></span></div>',
		/**
		@property inputclass 
		@default 'input-small'
		**/
		inputclass: 'input-small',

		/* datepicker config */
		datepicker: {
			weekStart: 0,
			startView: 0,
			minViewMode: 0,
			autoclose: true
		}
	});

	$.fn.editabletypes.datefield = DateField;

}(window.jQuery));
/**
Bootstrap-datetimepicker.  
Based on [smalot bootstrap-datetimepicker plugin](https://github.com/smalot/bootstrap-datetimepicker). 
Before usage you should manually include dependent js and css:

    <link href="css/datetimepicker.css" rel="stylesheet" type="text/css"></link> 
    <script src="js/bootstrap-datetimepicker.js"></script>

For **i18n** you should include js file from here: https://github.com/smalot/bootstrap-datetimepicker/tree/master/js/locales
and set `language` option.  

@class datetime
@extends abstractinput
@final
@since 1.4.4
@example
<a href="#" id="last_seen" data-type="datetime" data-pk="1" data-url="/post" title="Select date & time">15/03/2013 12:45</a>
<script>
$(function(){
    $('#last_seen').editable({
        format: 'yyyy-mm-dd hh:ii',    
        viewformat: 'dd/mm/yyyy hh:ii',    
        datetimepicker: {
                weekStart: 1
           }
        }
    });
});
</script>
**/
(function($) {
	"use strict";

	var DateTime = function(options) {
		this.init('datetime', options, DateTime.defaults);
		this.initPicker(options, DateTime.defaults);
	};

	$.fn.editableutils.inherit(DateTime, $.fn.editabletypes.abstractinput);

	$.extend(DateTime.prototype, {
		initPicker: function(options, defaults) {
			//'format' is set directly from settings or data-* attributes

			//by default viewformat equals to format
			if (!this.options.viewformat) {
				this.options.viewformat = this.options.format;
			}

			//try parse datetimepicker config defined as json string in data-datetimepicker
			options.datetimepicker = $.fn.editableutils.tryParseJson(options.datetimepicker, true);

			//overriding datetimepicker config (as by default jQuery extend() is not recursive)
			//since 1.4 datetimepicker internally uses viewformat instead of format. Format is for submit only
			this.options.datetimepicker = $.extend({}, defaults.datetimepicker, options.datetimepicker, {
				format: this.options.viewformat
			});

			//language
			this.options.datetimepicker.language = this.options.datetimepicker.language || 'en';

			//store DPglobal
			this.dpg = $.fn.datetimepicker.DPGlobal;

			//store parsed formats
			this.parsedFormat = this.dpg.parseFormat(this.options.format, this.options.formatType);
			this.parsedViewFormat = this.dpg.parseFormat(this.options.viewformat, this.options.formatType);
		},

		render: function() {
			this.$input.datetimepicker(this.options.datetimepicker);

			//adjust container position when viewMode changes
			//see https://github.com/smalot/bootstrap-datetimepicker/pull/80
			this.$input.on('changeMode', function(e) {
				var f = $(this).closest('form').parent();
				//timeout here, otherwise container changes position before form has new size
				setTimeout(function() {
					f.triggerHandler('resize');
				}, 0);
			});

			//"clear" link
			if (this.options.clear) {
				this.$clear = $('<a href="#"></a>').html(this.options.clear).click($.proxy(function(e) {
					e.preventDefault();
					e.stopPropagation();
					this.clear();
				}, this));

				this.$tpl.parent().append($('<div class="editable-clear">').append(this.$clear));
			}
		},

		value2html: function(value, element) {
			//formatDate works with UTCDate!
			var text = value ? this.dpg.formatDate(this.toUTC(value), this.parsedViewFormat, this.options.datetimepicker.language, this.options.formatType) : '';
			if (element) {
				DateTime.superclass.value2html.call(this, text, element);
			} else {
				return text;
			}
		},

		html2value: function(html) {
			//parseDate return utc date!
			var value = this.parseDate(html, this.parsedViewFormat);
			return value ? this.fromUTC(value) : null;
		},

		value2str: function(value) {
			//formatDate works with UTCDate!
			return value ? this.dpg.formatDate(this.toUTC(value), this.parsedFormat, this.options.datetimepicker.language, this.options.formatType) : '';
		},

		str2value: function(str) {
			//parseDate return utc date!
			var value = this.parseDate(str, this.parsedFormat);
			return value ? this.fromUTC(value) : null;
		},

		value2submit: function(value) {
			return this.value2str(value);
		},

		value2input: function(value) {
			if (value) {
				this.$input.data('datetimepicker').setDate(value);
			}
		},

		input2value: function() {
			//date may be cleared, in that case getDate() triggers error
			var dt = this.$input.data('datetimepicker');
			return dt.date ? dt.getDate() : null;
		},

		activate: function() {},

		clear: function() {
			this.$input.data('datetimepicker').date = null;
			this.$input.find('.active').removeClass('active');
			if (!this.options.showbuttons) {
				this.$input.closest('form').submit();
			}
		},

		autosubmit: function() {
			this.$input.on('mouseup', '.minute', function(e) {
				var $form = $(this).closest('form');
				setTimeout(function() {
					$form.submit();
				}, 200);
			});
		},

		//convert date from local to utc
		toUTC: function(value) {
			return value ? new Date(value.valueOf() - value.getTimezoneOffset() * 60000) : value;
		},

		//convert date from utc to local
		fromUTC: function(value) {
			return value ? new Date(value.valueOf() + value.getTimezoneOffset() * 60000) : value;
		},

		/*
		 For incorrect date bootstrap-datetimepicker returns current date that is not suitable
		 for datetimefield.
		 This function returns null for incorrect date.  
		*/
		parseDate: function(str, format) {
			var date = null,
				formattedBack;
			if (str) {
				date = this.dpg.parseDate(str, format, this.options.datetimepicker.language, this.options.formatType);
				if (typeof str === 'string') {
					formattedBack = this.dpg.formatDate(date, format, this.options.datetimepicker.language, this.options.formatType);
					if (str !== formattedBack) {
						date = null;
					}
				}
			}
			return date;
		}

	});

	DateTime.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
		/**
		@property tpl 
		@default <div></div>
		**/
		tpl: '<div class="editable-date well"></div>',
		/**
		@property inputclass 
		@default null
		**/
		inputclass: null,
		/**
		Format used for sending value to server. Also applied when converting date from <code>data-value</code> attribute.<br>
		Possible tokens are: <code>d, dd, m, mm, yy, yyyy, h, i</code>  
        
		@property format 
		@type string
		@default yyyy-mm-dd hh:ii
		**/
		format: 'yyyy-mm-dd hh:ii',
		formatType: 'standard',
		/**
		Format used for displaying date. Also applied when converting date from element's text on init.   
		If not specified equals to <code>format</code>
        
		@property viewformat 
		@type string
		@default null
		**/
		viewformat: null,
		/**
		Configuration of datetimepicker.
		Full list of options: https://github.com/smalot/bootstrap-datetimepicker

		@property datetimepicker 
		@type object
		@default { }
		**/
		datetimepicker: {
			todayHighlight: false,
			autoclose: false
		},
		/**
		Text shown as clear date button. 
		If <code>false</code> clear button will not be rendered.

		@property clear 
		@type boolean|string
		@default 'x clear'
		**/
		clear: '&times; clear'
	});

	$.fn.editabletypes.datetime = DateTime;

}(window.jQuery));
/**
Bootstrap datetimefield input - datetime input for inline mode.
Shows normal <input type="text"> and binds popup datetimepicker.  
Automatically shown in inline mode.

@class datetimefield
@extends datetime

**/
(function($) {
	"use strict";

	var DateTimeField = function(options) {
		this.init('datetimefield', options, DateTimeField.defaults);
		this.initPicker(options, DateTimeField.defaults);
	};

	$.fn.editableutils.inherit(DateTimeField, $.fn.editabletypes.datetime);

	$.extend(DateTimeField.prototype, {
		render: function() {
			this.$input = this.$tpl.find('input');
			this.setClass();
			this.setAttr('placeholder');

			this.$tpl.datetimepicker(this.options.datetimepicker);

			//need to disable original event handlers
			this.$input.off('focus keydown');

			//update value of datepicker
			this.$input.keyup($.proxy(function() {
				this.$tpl.removeData('date');
				this.$tpl.datetimepicker('update');
			}, this));

		},

		value2input: function(value) {
			this.$input.val(this.value2html(value));
			this.$tpl.datetimepicker('update');
		},

		input2value: function() {
			return this.html2value(this.$input.val());
		},

		activate: function() {
			$.fn.editabletypes.text.prototype.activate.call(this);
		},

		autosubmit: function() {
			//reset autosubmit to empty  
		}
	});

	DateTimeField.defaults = $.extend({}, $.fn.editabletypes.datetime.defaults, {
		/**
		@property tpl 
		**/
		tpl: '<div class="input-append date"><input type="text"/><span class="add-on"><i class="icon-th"></i></span></div>',
		/**
		@property inputclass 
		@default 'input-medium'
		**/
		inputclass: 'input-medium',

		/* datetimepicker config */
		datetimepicker: {
			todayHighlight: false,
			autoclose: true
		}
	});

	$.fn.editabletypes.datetimefield = DateTimeField;

}(window.jQuery));
/**
 * @author zhixin wen <wenzhixin2010@gmail.com>
 * extensions: https://github.com/kayalshri/tableExport.jquery.plugin
 */

(function ($) {
    'use strict';
    var sprintf = $.fn.bootstrapTable.utils.sprintf;

    var TYPE_NAME = {
        json: 'JSON',
        xml: 'XML',
        png: 'PNG',
        csv: 'CSV',
        txt: 'TXT',
        sql: 'SQL',
        doc: 'MS-Word',
        excel: 'MS-Excel',
        powerpoint: 'MS-Powerpoint',
        pdf: 'PDF'
    };

    $.extend($.fn.bootstrapTable.defaults, {
        showExport: false,
        exportDataType: 'basic', // basic, all, selected
        // 'json', 'xml', 'png', 'csv', 'txt', 'sql', 'doc', 'excel', 'powerpoint', 'pdf'
        exportTypes: ['json', 'xml', 'csv', 'txt', 'sql', 'excel'],
        exportOptions: {}
    });

    $.extend($.fn.bootstrapTable.defaults.icons, {
        export: 'glyphicon-export icon-share'
    });

    var BootstrapTable = $.fn.bootstrapTable.Constructor,
        _initToolbar = BootstrapTable.prototype.initToolbar;

    BootstrapTable.prototype.initToolbar = function () {
        this.showToolbar = this.options.showExport;

        _initToolbar.apply(this, Array.prototype.slice.apply(arguments));

        if (this.options.showExport) {
            var that = this,
                $btnGroup = this.$toolbar.find('>.btn-group'),
                $export = $btnGroup.find('div.export');

            if (!$export.length) {
                $export = $([
                    '<div class="export btn-group">',
                        '<button title="下载" class="btn btn-default' +
//                          sprintf(' btn-%s', this.options.buttonsClass) +
                            sprintf(' btn-%s', this.options.iconSize) +
                            ' dropdown-toggle" ' +
                            'data-toggle="dropdown" type="button">',
                            sprintf('<i class="%s %s"></i> ', this.options.iconsPrefix, this.options.icons.export),
                            '<span class="caret"></span>',
                        '</button>',
                        '<ul class="dropdown-menu" role="menu">',
                        '</ul>',
                    '</div>'].join('')).appendTo($btnGroup);

                var $menu = $export.find('.dropdown-menu'),
                    exportTypes = this.options.exportTypes;

                if (typeof this.options.exportTypes === 'string') {
                    var types = this.options.exportTypes.slice(1, -1).replace(/ /g, '').split(',');

                    exportTypes = [];
                    $.each(types, function (i, value) {
                        exportTypes.push(value.slice(1, -1));
                    });
                }
                $.each(exportTypes, function (i, type) {
                    if (TYPE_NAME.hasOwnProperty(type)) {
                        $menu.append(['<li data-type="' + type + '">',
                                '<a href="javascript:void(0)">',
                                    TYPE_NAME[type],
                                '</a>',
                            '</li>'].join(''));
                    }
                });

                $menu.find('li').click(function () {
                    var type = $(this).data('type'),
                        doExport = function () {
                            that.$el.tableExport($.extend({}, that.options.exportOptions, {
                                type: type,
                                escape: false
                            }));
                        };

                    if (that.options.exportDataType === 'all' && that.options.pagination) {
                        that.$el.one(that.options.sidePagination === 'server' ? 'post-body.bs.table' : 'page-change.bs.table', function () {
                            doExport();
                            that.togglePagination();
                        });
                        that.togglePagination();
                    } else if (that.options.exportDataType === 'selected') {
                        var data = that.getData(),
                            selectedData = that.getAllSelections();

                        that.load(selectedData);
                        doExport();
                        that.load(data);
                    } else {
                        doExport();
                    }
                });
            }
        }
    };
})(jQuery);
/*
 tableExport.jquery.plugin

 Copyright (c) 2015,2016 hhurz, https://github.com/hhurz/tableExport.jquery.plugin

 Original work Copyright (c) 2014 Giri Raj, https://github.com/kayalshri/
 Licensed under the MIT License, http://opensource.org/licenses/mit-license
*/

(function ($) {
  $.fn.extend({
    tableExport: function (options) {
      var defaults = {
        consoleLog: false,
        csvEnclosure: '"',
        csvSeparator: ',',
        csvUseBOM: true,
        displayTableName: false,
        escape: false,
        excelstyles: [], // e.g. ['border-bottom', 'border-top', 'border-left', 'border-right']
        fileName: 'tableExport',
        htmlContent: false,
        ignoreColumn: [],
        ignoreRow:[],
        jsonScope: 'all', // head, data, all
        jspdf: {orientation: 'p',
                unit: 'pt',
                format: 'a4', // jspdf page format or 'bestfit' for autmatic paper format selection
                margins: {left: 20, right: 10, top: 10, bottom: 10},
                autotable: {styles: {cellPadding: 2,
                                     rowHeight: 12,
                                     fontSize: 8,
                                     fillColor: 255,        // color value or 'inherit' to use css background-color from html table
                                     textColor: 50,         // color value or 'inherit' to use css color from html table
                                     fontStyle: 'normal',   // normal, bold, italic, bolditalic or 'inherit' to use css font-weight and fonst-style from html table
                                     overflow: 'ellipsize', // visible, hidden, ellipsize or linebreak
                                     halign: 'left',        // left, center, right
                                     valign: 'middle'       // top, middle, bottom
                                    },
                            headerStyles: {fillColor: [52, 73, 94],
                                           textColor: 255,
                                           fontStyle: 'bold',
                                           halign: 'center'
                                          },
                            alternateRowStyles: {fillColor: 245
                                                },
                            tableExport: {onAfterAutotable: null,
                                          onBeforeAutotable: null,
                                          onTable: null
                                         }
                           }
               },
        numbers: {html: {decimalMark: '.',
                         thousandsSeparator: ','
                        },
                  output: {decimalMark: '.',
                           thousandsSeparator: ','
                          }
                 },
        onCellData: null,
        onCellHtmlData: null,
        outputMode: 'file', // 'file', 'string' or 'base64'
        tbodySelector: 'tr',
        theadSelector: 'tr',
        tableName: 'myTableName',
        type: 'csv', // 'csv', 'txt', 'sql', 'json', 'xml', 'excel', 'doc', 'png' or 'pdf'
        worksheetName: 'xlsWorksheetName'
      };

      var FONT_ROW_RATIO = 1.15;
      var el = this;
      var DownloadEvt = null;
      var $hrows = [];
      var $rows = [];
      var rowIndex = 0;
      var rowspans = [];
      var trData = '';
      var colNames = [];

      $.extend(true, defaults, options);

      colNames = GetColumnNames (el);

      if (defaults.type == 'csv' || defaults.type == 'txt') {

        var csvData = "";
        var rowlength = 0;
        rowIndex = 0;

        function CollectCsvData (tgroup, tselector, rowselector, length) {

          $rows = $(el).find(tgroup).first().find(tselector);
          $rows.each(function () {
            trData = "";
            ForEachVisibleCell(this, rowselector, rowIndex, length + $rows.length,
                    function (cell, row, col) {
                      trData += csvString(cell, row, col) + defaults.csvSeparator;
                    });
            trData = $.trim(trData).substring(0, trData.length - 1);
            if (trData.length > 0) {

              if (csvData.length > 0)
                csvData += "\n";

              csvData += trData;
            }
            rowIndex++;
          });

          return $rows.length;
        }

        rowlength += CollectCsvData ('thead', defaults.theadSelector, 'th,td', rowlength);
        rowlength += CollectCsvData ('tbody', defaults.tbodySelector, 'td', rowlength);
        CollectCsvData ('tfoot', defaults.tbodySelector, 'td', rowlength);

        csvData += "\n";

        //output
        if (defaults.consoleLog === true)
          console.log(csvData);

        if (defaults.outputMode === 'string')
          return csvData;

        if (defaults.outputMode === 'base64')
          return base64encode(csvData);

        try {
          var blob = new Blob([csvData], {type: "text/" + (defaults.type == 'csv' ? 'csv' : 'plain') + ";charset=utf-8"});
          saveAs(blob, defaults.fileName + '.' + defaults.type, (defaults.type != 'csv' || defaults.csvUseBOM === false));
        }
        catch (e) {
          downloadFile(defaults.fileName + '.' + defaults.type,
                       'data:text/' + (defaults.type == 'csv' ? 'csv' : 'plain') + ';charset=utf-8,' + ((defaults.type == 'csv' && defaults.csvUseBOM)? '\ufeff' : ''),
                       csvData);
        }

      } else if (defaults.type == 'sql') {

        // Header
        rowIndex = 0;
        var tdData = "INSERT INTO `" + defaults.tableName + "` (";
        $hrows = $(el).find('thead').first().find(defaults.theadSelector);
        $hrows.each(function () {
          ForEachVisibleCell(this, 'th,td', rowIndex, $hrows.length,
                  function (cell, row, col) {
                    tdData += "'" + parseString(cell, row, col) + "',";
                  });
          rowIndex++;
          tdData = $.trim(tdData);
          tdData = $.trim(tdData).substring(0, tdData.length - 1);
        });
        tdData += ") VALUES ";
        // Row vs Column
        $rows = $(el).find('tbody').first().find(defaults.tbodySelector);
        $rows.each(function () {
          trData = "";
          ForEachVisibleCell(this, 'td', rowIndex, $hrows.length + $rows.length,
                  function (cell, row, col) {
                    trData += "'" + parseString(cell, row, col) + "',";
                  });
          if (trData.length > 3) {
            tdData += "(" + trData;
            tdData = $.trim(tdData).substring(0, tdData.length - 1);
            tdData += "),";
          }
          rowIndex++;
        });

        tdData = $.trim(tdData).substring(0, tdData.length - 1);
        tdData += ";";

        //output
        if (defaults.consoleLog === true)
          console.log(tdData);

        if (defaults.outputMode === 'string')
          return tdData;

        if (defaults.outputMode === 'base64')
          return base64encode(tdData);

        try {
          var blob = new Blob([tdData], {type: "text/plain;charset=utf-8"});
          saveAs(blob, defaults.fileName + '.sql');
        }
        catch (e) {
          downloadFile(defaults.fileName + '.sql',
                       'data:application/sql;charset=utf-8,',
                       tdData);
        }

      } else if (defaults.type == 'json') {

        var jsonHeaderArray = [];
        $hrows = $(el).find('thead').first().find(defaults.theadSelector);
        $hrows.each(function () {
          var jsonArrayTd = [];

          ForEachVisibleCell(this, 'th,td', rowIndex, $hrows.length,
                  function (cell, row, col) {
                    jsonArrayTd.push(parseString(cell, row, col));
                  });
          jsonHeaderArray.push(jsonArrayTd);
        });

        var jsonArray = [];
        $rows = $(el).find('tbody').first().find(defaults.tbodySelector);
        $rows.each(function () {
          var jsonObjectTd = {};

          var colIndex = 0;
          ForEachVisibleCell(this, 'td', rowIndex, $hrows.length + $rows.length,
                  function (cell, row, col) {
                    if (jsonHeaderArray.length) {
                      jsonObjectTd[jsonHeaderArray[jsonHeaderArray.length-1][colIndex]] = parseString(cell, row, col);
                    } else {
                      jsonObjectTd[colIndex] = parseString(cell, row, col);
                    }
                    colIndex++;
                  });
          if ($.isEmptyObject(jsonObjectTd) == false)
            jsonArray.push(jsonObjectTd);

          rowIndex++;
        });

        var sdata = "";

        if (defaults.jsonScope == 'head')
          sdata = JSON.stringify(jsonHeaderArray);
        else if (defaults.jsonScope == 'data')
          sdata = JSON.stringify(jsonArray);
        else // all
          sdata = JSON.stringify({header: jsonHeaderArray, data: jsonArray});

        if (defaults.consoleLog === true)
          console.log(sdata);

        if (defaults.outputMode === 'string')
          return sdata;

        if (defaults.outputMode === 'base64')
          return base64encode(sdata);

        try {
          var blob = new Blob([sdata], {type: "application/json;charset=utf-8"});
          saveAs(blob, defaults.fileName + '.json');
        }
        catch (e) {
          downloadFile(defaults.fileName + '.json',
                       'data:application/json;charset=utf-8;base64,',
                       sdata);
        }

      } else if (defaults.type === 'xml') {

        rowIndex = 0;
        var xml = '<?xml version="1.0" encoding="utf-8"?>';
        xml += '<tabledata><fields>';

        // Header
        $hrows = $(el).find('thead').first().find(defaults.theadSelector);
        $hrows.each(function () {

          ForEachVisibleCell(this, 'th,td', rowIndex, $rows.length,
                  function (cell, row, col) {
                    xml += "<field>" + parseString(cell, row, col) + "</field>";
                  });
          rowIndex++;
        });
        xml += '</fields><data>';

        // Row Vs Column
        var rowCount = 1;
        $rows = $(el).find('tbody').first().find(defaults.tbodySelector);
        $rows.each(function () {
          var colCount = 1;
          trData = "";
          ForEachVisibleCell(this, 'td', rowIndex, $hrows.length + $rows.length,
                  function (cell, row, col) {
                    trData += "<column-" + colCount + ">" + parseString(cell, row, col) + "</column-" + colCount + ">";
                    colCount++;
                  });
          if (trData.length > 0 && trData != "<column-1></column-1>") {
            xml += '<row id="' + rowCount + '">' + trData + '</row>';
            rowCount++;
          }

          rowIndex++;
        });
        xml += '</data></tabledata>';

        //output
        if (defaults.consoleLog === true)
          console.log(xml);

        if (defaults.outputMode === 'string')
          return xml;

        if (defaults.outputMode === 'base64')
          return base64encode(xml);

        try {
          var blob = new Blob([xml], {type: "application/xml;charset=utf-8"});
          saveAs(blob, defaults.fileName + '.xml');
        }
        catch (e) {
          downloadFile(defaults.fileName + '.xml',
                       'data:application/xml;charset=utf-8;base64,',
                       xml);
        }

      } else if (defaults.type == 'excel' || defaults.type == 'xls' || defaults.type == 'word' || defaults.type == 'doc') {

        var MSDocType = (defaults.type == 'excel' || defaults.type == 'xls') ? 'excel' : 'word';
        var MSDocExt = (MSDocType == 'excel') ? 'xls' : 'doc';
        var MSDocSchema = (MSDocExt == 'xls') ? 'xmlns:x="urn:schemas-microsoft-com:office:excel"' : 'xmlns:w="urn:schemas-microsoft-com:office:word"';
        var $tables = $(el).filter(function() {
            return $(this).data("tableexport-display") != 'none' &&
                   ($(this).is(':visible') ||
                    $(this).data("tableexport-display") == 'always');
          });
        var docData = '';

        $tables.each(function(){
          rowIndex = 0;

          colNames = GetColumnNames (this);

          docData += '<table><thead>';
          // Header
          $hrows = $(this).find('thead').first().find(defaults.theadSelector);
          $hrows.each(function() {
            trData = "";
            ForEachVisibleCell(this, 'th,td', rowIndex, $hrows.length,
              function(cell, row, col) {
                if (cell != null) {
                  var thstyle = '';
                  trData += '<th';
                  for (var styles in defaults.excelstyles) {
                    if (defaults.excelstyles.hasOwnProperty(styles)) {
                      var thcss = $(cell).css(defaults.excelstyles[styles]);
                      if (thcss != '' && thcss !='0px none rgb(0, 0, 0)') {
                        if (thstyle == '')
                          thstyle = 'style="';
                        thstyle += defaults.excelstyles[styles] + ':' + thcss + ';';
                      }
                    }
                  }
                  if (thstyle != '' )
                    trData += ' ' + thstyle + '"';
                  if ($(cell).is("[colspan]"))
                    trData += ' colspan="' + $(cell).attr('colspan') + '"';
                  if ($(cell).is("[rowspan]"))
                    trData += ' rowspan="' + $(cell).attr('rowspan') + '"';
                  trData += '>' + parseString(cell, row, col) + '</th>';
                }
              });
            if (trData.length > 0)
              docData += '<tr>' + trData + '</tr>';
            rowIndex++;
          });

          docData += '</thead><tbody>';
          // Row Vs Column
          $rows = $(this).find('tbody').first().find(defaults.tbodySelector);
          $rows.each(function() {
            trData = "";
            ForEachVisibleCell(this, 'td', rowIndex, $hrows.length + $rows.length,
              function(cell, row, col) {
                if (cell != null) {
                  var tdstyle = '';
                  trData += '<td';
                  for (var styles in defaults.excelstyles) {
                    if (defaults.excelstyles.hasOwnProperty(styles)) {
                      var tdcss = $(cell).css(defaults.excelstyles[styles]);
                      if (tdcss != '' && tdcss !='0px none rgb(0, 0, 0)') {
                        if (tdstyle == '')
                          tdstyle = 'style="';
                        tdstyle += defaults.excelstyles[styles] + ':' + tdcss + ';';
                      }
                    }
                  }
                  if (tdstyle != '' )
                    trData += ' ' + tdstyle + '"';
                  if ($(cell).is("[colspan]"))
                    trData += ' colspan="' + $(cell).attr('colspan') + '"';
                  if ($(cell).is("[rowspan]"))
                    trData += ' rowspan="' + $(cell).attr('rowspan') + '"';
                  trData += '>' + parseString(cell, row, col) + '</td>';
                }
              });
            if (trData.length > 0)
              docData += '<tr>' + trData + '</tr>';
            rowIndex++;
          });

          if (defaults.displayTableName)
            docData += '<tr><td></td></tr><tr><td></td></tr><tr><td>' + parseString($('<p>' + defaults.tableName + '</p>')) + '</td></tr>';

          docData += '</tbody></table>';

          if (defaults.consoleLog === true)
            console.log(docData);
        });

        var docFile = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' + MSDocSchema + ' xmlns="http://www.w3.org/TR/REC-html40">';
        docFile += '<meta http-equiv="content-type" content="application/vnd.ms-' + MSDocType + '; charset=UTF-8">';
        docFile += "<head>";
        if (MSDocType === 'excel') {
          docFile += "<!--[if gte mso 9]>";
          docFile += "<xml>";
          docFile += "<x:ExcelWorkbook>";
          docFile += "<x:ExcelWorksheets>";
          docFile += "<x:ExcelWorksheet>";
          docFile += "<x:Name>";
          docFile += defaults.worksheetName;
          docFile += "</x:Name>";
          docFile += "<x:WorksheetOptions>";
          docFile += "<x:DisplayGridlines/>";
          docFile += "</x:WorksheetOptions>";
          docFile += "</x:ExcelWorksheet>";
          docFile += "</x:ExcelWorksheets>";
          docFile += "</x:ExcelWorkbook>";
          docFile += "</xml>";
          docFile += "<![endif]-->";
        }
        docFile += "</head>";
        docFile += "<body>";
        docFile += docData;
        docFile += "</body>";
        docFile += "</html>";

        if (defaults.consoleLog === true)
          console.log(docFile);

        if (defaults.outputMode === 'string')
          return docFile;

        if (defaults.outputMode === 'base64')
          return base64encode(docFile);

        try {
          var blob = new Blob([docFile], {type: 'application/vnd.ms-' + defaults.type});
          saveAs(blob, defaults.fileName + '.' + MSDocExt);
        }
        catch (e) {
          downloadFile(defaults.fileName + '.' + MSDocExt,
                       'data:application/vnd.ms-' + MSDocType + ';base64,',
                       docFile);
        }

      } else if (defaults.type == 'png') {
        html2canvas($(el)[0], {
          allowTaint: true,
          background: '#fff',
          onrendered: function (canvas) {

            var image = canvas.toDataURL();
            image = image.substring(22); // remove data stuff

            var byteString = atob(image);
            var buffer = new ArrayBuffer(byteString.length);
            var intArray = new Uint8Array(buffer);

            for (var i = 0; i < byteString.length; i++)
              intArray[i] = byteString.charCodeAt(i);

            if (defaults.consoleLog === true)
              console.log(byteString);

            if (defaults.outputMode === 'string')
              return byteString;

            if (defaults.outputMode === 'base64')
              return base64encode(image);

            try {
              var blob = new Blob([buffer], {type: "image/png"});
              saveAs(blob, defaults.fileName + '.png');
            }
            catch (e) {
              downloadFile(defaults.fileName + '.png',
                           'data:image/png;base64,',
                           image);
            }
          }
        });

      } else if (defaults.type == 'pdf') {
        if (defaults.jspdf.autotable === false) {
          var addHtmlOptions = {
            dim: {
              w: getPropertyUnitValue($(el).first().get(0), 'width', 'mm'),
              h: getPropertyUnitValue($(el).first().get(0), 'height', 'mm')
            },
            pagesplit: false
          };

          var doc = new jsPDF(defaults.jspdf.orientation, defaults.jspdf.unit, defaults.jspdf.format);
          doc.addHTML($(el).first(),
                  defaults.jspdf.margins.left,
                  defaults.jspdf.margins.top,
                  addHtmlOptions,
                  function () {
                    jsPdfOutput(doc);
                  });
          //delete doc;
        }
        else {
          // pdf output using jsPDF AutoTable plugin
          // https://github.com/simonbengtsson/jsPDF-AutoTable

          var teOptions = defaults.jspdf.autotable.tableExport;

          // When setting jspdf.format to 'bestfit' tableExport tries to choose
          // the minimum required paper format and orientation in which the table
          // (or tables in multitable mode) completely fits without column adjustment
          if (typeof defaults.jspdf.format === 'string' && defaults.jspdf.format.toLowerCase() === 'bestfit') {
            var pageFormats = {
              'a0': [2383.94, 3370.39], 'a1': [1683.78, 2383.94],
              'a2': [1190.55, 1683.78], 'a3': [841.89, 1190.55],
              'a4': [595.28, 841.89]
            };
            var rk = '', ro = '';
            var mw = 0;

            $(el).filter(':visible').each(function () {
              if ($(this).css('display') != 'none') {
                var w = getPropertyUnitValue($(this).get(0), 'width', 'pt');

                if (w > mw) {
                  if (w > pageFormats['a0'][0]) {
                    rk = 'a0';
                    ro = 'l';
                  }
                  for (var key in pageFormats) {
                    if (pageFormats.hasOwnProperty(key)) {
                      if (pageFormats[key][1] > w) {
                        rk = key;
                        ro = 'l';
                        if (pageFormats[key][0] > w)
                          ro = 'p';
                      }
                    }
                  }
                  mw = w;
                }
              }
            });
            defaults.jspdf.format = (rk == '' ? 'a4' : rk);
            defaults.jspdf.orientation = (ro == '' ? 'w' : ro);
          }

          // The jsPDF doc object is stored in defaults.jspdf.autotable.tableExport,
          // thus it can be accessed from any callback function
          teOptions.doc = new jsPDF(defaults.jspdf.orientation,
                  defaults.jspdf.unit,
                  defaults.jspdf.format);

          $(el).filter(function() {
            return $(this).data("tableexport-display") != 'none' &&
                   ($(this).is(':visible') ||
                    $(this).data("tableexport-display") == 'always');
          }).each(function () {
            var colKey;
            var rowIndex = 0;

            colNames = GetColumnNames (this);

            teOptions.columns = [];
            teOptions.rows = [];
            teOptions.rowoptions = {};

            // onTable: optional callback function for every matching table that can be used
            // to modify the tableExport options or to skip the output of a particular table
            // if the table selector targets multiple tables
            if (typeof teOptions.onTable === 'function')
              if (teOptions.onTable($(this), defaults) === false)
                return true; // continue to next iteration step (table)

            // each table works with an own copy of AutoTable options
            defaults.jspdf.autotable.tableExport = null;  // avoid deep recursion error
            var atOptions = $.extend(true, {}, defaults.jspdf.autotable);
            defaults.jspdf.autotable.tableExport = teOptions;

            atOptions.margin = {};
            $.extend(true, atOptions.margin, defaults.jspdf.margins);
            atOptions.tableExport = teOptions;

            // Fix jsPDF Autotable's row height calculation
            if (typeof atOptions.beforePageContent !== 'function') {
              atOptions.beforePageContent = function (data) {
                if (data.pageCount == 1) {
                  var all = data.table.rows.concat(data.table.headerRow);
                  all.forEach(function (row) {
                    if ( row.height > 0 ) {
                      row.height += (2 - FONT_ROW_RATIO) / 2 * row.styles.fontSize;
                      data.table.height += (2 - FONT_ROW_RATIO) / 2 * row.styles.fontSize;
                    }
                  });
                }
              }
            }

            if (typeof atOptions.createdHeaderCell !== 'function') {
              // apply some original css styles to pdf header cells
              atOptions.createdHeaderCell = function (cell, data) {

                // jsPDF AutoTable plugin v2.0.14 fix: each cell needs its own styles object
                cell.styles = $.extend({}, data.row.styles);

                if (typeof teOptions.columns [data.column.dataKey] != 'undefined') {
                  var col = teOptions.columns [data.column.dataKey];

                  if (typeof col.rect != 'undefined') {
                    var rh;

                    cell.contentWidth = col.rect.width;

                    if (typeof teOptions.heightRatio == 'undefined' || teOptions.heightRatio == 0) {
                      if (data.row.raw [data.column.dataKey].rowspan)
                        rh = data.row.raw [data.column.dataKey].rect.height / data.row.raw [data.column.dataKey].rowspan;
                      else
                        rh = data.row.raw [data.column.dataKey].rect.height;

                      teOptions.heightRatio = cell.styles.rowHeight / rh;
                    }

                    rh = data.row.raw [data.column.dataKey].rect.height * teOptions.heightRatio;
                    if (rh > cell.styles.rowHeight)
                      cell.styles.rowHeight = rh;
                  }

                  if (typeof col.style != 'undefined' && col.style.hidden !== true) {
                    cell.styles.halign = col.style.align;
                    if (atOptions.styles.fillColor === 'inherit')
                      cell.styles.fillColor = col.style.bcolor;
                    if (atOptions.styles.textColor === 'inherit')
                      cell.styles.textColor = col.style.color;
                    if (atOptions.styles.fontStyle === 'inherit')
                      cell.styles.fontStyle = col.style.fstyle;
                  }
                }
              }
            }

            if (typeof atOptions.createdCell !== 'function') {
              // apply some original css styles to pdf table cells
              atOptions.createdCell = function (cell, data) {
                var rowopt = teOptions.rowoptions [data.row.index + ":" + data.column.dataKey];

                if (typeof rowopt != 'undefined' &&
                    typeof rowopt.style != 'undefined' &&
                    rowopt.style.hidden !== true) {
                  cell.styles.halign = rowopt.style.align;
                  if (atOptions.styles.fillColor === 'inherit')
                    cell.styles.fillColor = rowopt.style.bcolor;
                  if (atOptions.styles.textColor === 'inherit')
                    cell.styles.textColor = rowopt.style.color;
                  if (atOptions.styles.fontStyle === 'inherit')
                    cell.styles.fontStyle = rowopt.style.fstyle;
                }
              }
            }

            if (typeof atOptions.drawHeaderCell !== 'function') {
              atOptions.drawHeaderCell = function (cell, data) {
                var colopt = teOptions.columns [data.column.dataKey];

                if ((colopt.style.hasOwnProperty("hidden") != true || colopt.style.hidden !== true) &&
                    colopt.rowIndex >= 0 )
                  return prepareAutoTableText (cell, data, colopt);
                else
                  return false; // cell is hidden
              }
            }

            if (typeof atOptions.drawCell !== 'function') {
              atOptions.drawCell = function (cell, data) {
                var rowopt = teOptions.rowoptions [data.row.index + ":" + data.column.dataKey];
                if ( prepareAutoTableText (cell, data, rowopt) ) {

                  teOptions.doc.rect(cell.x, cell.y, cell.width, cell.height, cell.styles.fillStyle);

                  if (typeof rowopt != 'undefined' && typeof rowopt.kids != 'undefined' && rowopt.kids.length > 0) {

                    var dh = cell.height / rowopt.rect.height;
                    if ( dh > teOptions.dh || typeof teOptions.dh == 'undefined' )
                      teOptions.dh = dh;
                    teOptions.dw = cell.width / rowopt.rect.width;

                    drawCellElements (cell, rowopt.kids, teOptions);
                  }
                  teOptions.doc.autoTableText(cell.text, cell.textPos.x, cell.textPos.y, {
                      halign: cell.styles.halign,
                      valign: cell.styles.valign
                  });
                }
                return false;
              }
            }

            // collect header and data rows
            teOptions.headerrows = [];
            $hrows = $(this).find('thead').find(defaults.theadSelector);
            $hrows.each(function () {
              colKey = 0;

              teOptions.headerrows[rowIndex] = [];

              ForEachVisibleCell(this, 'th,td', rowIndex, $hrows.length,
                      function (cell, row, col) {
                        var obj = getCellStyles (cell);
                        obj.title = parseString(cell, row, col);
                        obj.key = colKey++;
                        obj.rowIndex = rowIndex;
                        teOptions.headerrows[rowIndex].push(obj);
                      });
              rowIndex++;
            });

            if (rowIndex > 0) {
              // iterate through last row
              $.each(teOptions.headerrows[rowIndex-1], function () {
                if (rowIndex > 1 && this.rect == null)
                  obj = teOptions.headerrows[rowIndex-2][this.key];
                else
                  obj = this;

                if (obj != null)
                  teOptions.columns.push(obj);
              });
            }

            var rowCount = 0;
            $rows = $(this).find('tbody').find(defaults.tbodySelector);
            $rows.each(function () {
              var rowData = [];
              colKey = 0;

              ForEachVisibleCell(this, 'td', rowIndex, $hrows.length + $rows.length,
                      function (cell, row, col) {
                        if (typeof teOptions.columns[colKey] === 'undefined') {
                          // jsPDF-Autotable needs columns. Thus define hidden ones for tables without thead
                          var obj = {
                            title: '',
                            key: colKey,
                            style: {
                              hidden: true
                            }
                          };
                          teOptions.columns.push(obj);
                        }
                        if (typeof cell !== 'undefined' && cell != null) {
                          var obj = getCellStyles (cell);
                          obj.kids = $(cell).children();
                          teOptions.rowoptions [rowCount + ":" + colKey++] = obj;
                        }
                        else {
                          var obj = $.extend(true, {}, teOptions.rowoptions [rowCount + ":" + (colKey-1)]);
                          obj.colspan = -1;
                          teOptions.rowoptions [rowCount + ":" + colKey++] = obj;
                        }

                        rowData.push(parseString(cell, row, col));
                      });
              if (rowData.length) {
                teOptions.rows.push(rowData);
                rowCount++
              }
              rowIndex++;
            });

            // onBeforeAutotable: optional callback function before calling
            // jsPDF AutoTable that can be used to modify the AutoTable options
            if (typeof teOptions.onBeforeAutotable === 'function')
              teOptions.onBeforeAutotable($(this), teOptions.columns, teOptions.rows, atOptions);

            teOptions.doc.autoTable(teOptions.columns, teOptions.rows, atOptions);

            // onAfterAutotable: optional callback function after returning
            // from jsPDF AutoTable that can be used to modify the AutoTable options
            if (typeof teOptions.onAfterAutotable === 'function')
              teOptions.onAfterAutotable($(this), atOptions);

            // set the start position for the next table (in case there is one)
            defaults.jspdf.autotable.startY = teOptions.doc.autoTableEndPosY() + atOptions.margin.top;
          });

          jsPdfOutput(teOptions.doc);

          if (typeof teOptions.headerrows != 'undefined')
            teOptions.headerrows.length = 0;
          if (typeof teOptions.columns != 'undefined')
            teOptions.columns.length = 0;
          if (typeof teOptions.rows != 'undefined')
            teOptions.rows.length = 0;
          delete teOptions.doc;
          teOptions.doc = null;
        }
      }

      function FindColObject (objects, colIndex, rowIndex) {
        var result = null;
        $.each(objects, function () {
          if (this.rowIndex == rowIndex && this.key == colIndex) {
            result = this;
            return false;
          }
        });
        return result;
      }

      function GetColumnNames (table) {
        var result = [];
        $(table).find('thead').first().find('th').each(function(index, el) {
          if ($(el).attr("data-field") !== undefined)
            result[index] = $(el).attr("data-field");
        });
        return result;
      }

      function isColumnIgnored($row, colIndex) {
        var result = false;
        if (defaults.ignoreColumn.length > 0) {
          if (typeof defaults.ignoreColumn[0] == 'string') {
            if (colNames.length > colIndex && typeof colNames[colIndex] != 'undefined')
              if ($.inArray(colNames[colIndex], defaults.ignoreColumn) != -1)
                result = true;
          }
          else if (typeof defaults.ignoreColumn[0] == 'number') {
            if ($.inArray(colIndex, defaults.ignoreColumn) != -1 ||
                $.inArray(colIndex-$row.length, defaults.ignoreColumn) != -1)
              result = true;
          }
        }
        return result;
      }

      function ForEachVisibleCell(tableRow, selector, rowIndex, rowCount, cellcallback) {
        if ($.inArray(rowIndex, defaults.ignoreRow) == -1 &&
            $.inArray(rowIndex-rowCount, defaults.ignoreRow) == -1) {

          var $row = $(tableRow).filter(function() {
            return $(this).data("tableexport-display") != 'none' &&
                   ($(this).is(':visible') ||
                    $(this).data("tableexport-display") == 'always' ||
                    $(this).closest('table').data("tableexport-display") == 'always');
          }).find(selector);

          var rowColspan = 0;
          var rowColIndex = 0;

          $row.each(function (colIndex) {
            if ($(this).data("tableexport-display") == 'always' ||
                ($(this).css('display') != 'none' &&
                 $(this).css('visibility') != 'hidden' &&
                 $(this).data("tableexport-display") != 'none')) {
              if (isColumnIgnored($row, colIndex) == false) {
                if (typeof (cellcallback) === "function") {
                  var c, Colspan = 0;
                  var r, Rowspan = 0;

                  // handle rowspans from previous rows
                  if (typeof rowspans[rowIndex] != 'undefined' && rowspans[rowIndex].length > 0) {
                    for (c = 0; c <= colIndex; c++) {
                      if (typeof rowspans[rowIndex][c] != 'undefined') {
                        cellcallback(null, rowIndex, c);
                        delete rowspans[rowIndex][c];
                        colIndex++;
                      }
                    }
                  }
                  rowColIndex = colIndex;

                  if ($(this).is("[colspan]")) {
                    Colspan = parseInt($(this).attr('colspan'));
                    rowColspan += Colspan > 0 ? Colspan - 1 : 0;
                  }

                  if ($(this).is("[rowspan]"))
                    Rowspan = parseInt($(this).attr('rowspan'));

                  // output content of current cell
                  cellcallback(this, rowIndex, colIndex);

                  // handle colspan of current cell
                  for (c = 0; c < Colspan - 1; c++)
                    cellcallback(null, rowIndex, colIndex + c);

                  // store rowspan for following rows
                  if (Rowspan) {
                    for (r = 1; r < Rowspan; r++) {
                      if (typeof rowspans[rowIndex + r] == 'undefined')
                        rowspans[rowIndex + r] = [];

                      rowspans[rowIndex + r][colIndex + rowColspan] = "";

                      for (c = 1; c < Colspan; c++)
                        rowspans[rowIndex + r][colIndex + rowColspan - c] = "";
                    }
                  }
                }
              }
            }
          });
          // handle rowspans from previous rows
          if (typeof rowspans[rowIndex] != 'undefined' && rowspans[rowIndex].length > 0) {
            for (c = 0; c <= rowspans[rowIndex].length; c++) {
              if (typeof rowspans[rowIndex][c] != 'undefined') {
                cellcallback(null, rowIndex, c);
                delete rowspans[rowIndex][c];
              }
            }
          }
        }
      }

      function jsPdfOutput(doc) {
        if (defaults.consoleLog === true)
          console.log(doc.output());

        if (defaults.outputMode === 'string')
          return doc.output();

        if (defaults.outputMode === 'base64')
          return base64encode(doc.output());

        try {
          var blob = doc.output('blob');
          saveAs(blob, defaults.fileName + '.pdf');
        }
        catch (e) {
          downloadFile(defaults.fileName + '.pdf',
                       'data:application/pdf;base64,',
                       doc.output());
        }
      }

      function prepareAutoTableText (cell, data, cellopt) {
        var cs = 0;
        if ( typeof cellopt != 'undefined' )
          cs = cellopt.colspan;

        if ( cs >= 0 ) {
          // colspan handling
          var cellWidth = cell.width;
          var textPosX = cell.textPos.x;
          var i = data.table.columns.indexOf(data.column);

          for (var c = 1; c < cs; c++) {
            var column = data.table.columns[i+c];
            cellWidth += column.width;
          }

          if ( cs > 1 ) {
            if ( cell.styles.halign === 'right' )
              textPosX = cell.textPos.x + cellWidth - cell.width;
            else if ( cell.styles.halign === 'center' )
              textPosX = cell.textPos.x + (cellWidth - cell.width) / 2;
          }

          cell.width = cellWidth;
          cell.textPos.x = textPosX;

          if ( typeof cellopt != 'undefined' && cellopt.rowspan > 1 )
            cell.height = cell.height * cellopt.rowspan;

          // fix jsPDF's calculation of text position
          if ( cell.styles.valign === 'middle' || cell.styles.valign === 'bottom' ) {
            var splittedText = typeof cell.text === 'string' ? cell.text.split(/\r\n|\r|\n/g) : cell.text;
            var lineCount = splittedText.length || 1;
            if (lineCount > 2)
              cell.textPos.y -= ((2 - FONT_ROW_RATIO) / 2 * data.row.styles.fontSize) * (lineCount-2) / 3 ;
          }
          return true;
        }
        else
          return false; // cell is hidden (colspan = -1), don't draw it
      }

      function drawCellElements (cell, elements, teOptions) {
        elements.each(function () {
          var kids = $(this).children();

          if ( $(this).is("div") ) {
            var bcolor = rgb2array(getStyle(this, 'background-color'), [255, 255, 255]);
            var lcolor = rgb2array(getStyle(this, 'border-top-color'), [0, 0, 0]);
            var lwidth = getPropertyUnitValue(this, 'border-top-width', defaults.jspdf.unit);

            var r = this.getBoundingClientRect();
            var ux = this.offsetLeft * teOptions.dw;
            var uy = this.offsetTop * teOptions.dh;
            var uw = r.width * teOptions.dw;
            var uh = r.height * teOptions.dh;

            teOptions.doc.setDrawColor.apply (undefined, lcolor);
            teOptions.doc.setFillColor.apply (undefined, bcolor);
            teOptions.doc.setLineWidth (lwidth);
            teOptions.doc.rect(cell.x + ux, cell.y + uy, uw, uh, lwidth ? "FD" : "F");
          }

          if (typeof kids != 'undefined' && kids.length > 0)
            drawCellElements (cell, kids, teOptions);
        });
      }

      function escapeRegExp(string) {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
      }

      function replaceAll(string, find, replace) {
        return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
      }

      // Takes a string and encapsulates it (by default in double-quotes) if it
      // contains the csv field separator, spaces, or linebreaks.
      function csvString(cell, rowIndex, colIndex) {
        var result = '';

        if (cell != null) {
          var dataString = parseString(cell, rowIndex, colIndex);

          var csvValue = (dataString === null || dataString == '') ? '' : dataString.toString();

          if (dataString instanceof Date)
            result = defaults.csvEnclosure + dataString.toLocaleString() + defaults.csvEnclosure;
          else {
            result = replaceAll(csvValue, defaults.csvEnclosure, defaults.csvEnclosure + defaults.csvEnclosure);

            if (result.indexOf(defaults.csvSeparator) >= 0 || /[\r\n ]/g.test(result))
              result = defaults.csvEnclosure + result + defaults.csvEnclosure;
          }
        }

        return result;
      }

      function parseNumber(value) {
        value = value || "0";
        value = replaceAll(value, defaults.numbers.html.decimalMark, '.');
        value = replaceAll(value, defaults.numbers.html.thousandsSeparator, '');

        return typeof value === "number" || jQuery.isNumeric(value) !== false ? value : false;
      }


      function parseString(cell, rowIndex, colIndex) {
        var result = '';

        if (cell != null) {
          var $cell = $(cell);
          var htmlData;

          if ($cell[0].hasAttribute("data-tableexport-value"))
            htmlData = $cell.data("tableexport-value");
          else
            htmlData = $cell.html();

          if (typeof defaults.onCellHtmlData === 'function')
            htmlData = defaults.onCellHtmlData($cell, rowIndex, colIndex, htmlData);

          if (defaults.htmlContent === true) {
            result = $.trim(htmlData);
          }
          else {
            var text = htmlData.replace(/\n/g,'\u2028').replace(/<br\s*[\/]?>/gi, '\u2060');
            var obj = $('<div/>').html(text).contents();
            text = '';
            $.each(obj.text().split("\u2028"), function(i, v) {
              if (i > 0)
                text += " ";
              text += $.trim(v);
            });

            $.each(text.split("\u2060"), function(i, v) {
              if (i > 0)
                result += "\n";
              result += $.trim(v).replace(/\u00AD/g, ""); // remove soft hyphens
            });

            if (defaults.numbers.html.decimalMark != defaults.numbers.output.decimalMark ||
                defaults.numbers.html.thousandsSeparator != defaults.numbers.output.thousandsSeparator) {
              var number = parseNumber (result);

              if ( number !== false ) {
                var frac = ("" + number).split('.');
                if ( frac.length == 1 )
                  frac[1] = "";
                var mod = frac[0].length > 3 ? frac[0].length % 3 : 0;

                result = (number < 0 ? "-" : "") +
                         (defaults.numbers.output.thousandsSeparator ? ((mod ? frac[0].substr(0, mod) + defaults.numbers.output.thousandsSeparator : "") + frac[0].substr(mod).replace(/(\d{3})(?=\d)/g, "$1" + defaults.numbers.output.thousandsSeparator)) : frac[0]) +
                         (frac[1].length ? defaults.numbers.output.decimalMark + frac[1] : "");
              }
            }
          }

          if (defaults.escape === true) {
            result = escape(result);
          }

          if (typeof defaults.onCellData === 'function') {
            result = defaults.onCellData($cell, rowIndex, colIndex, result);
          }
        }

        return result;
      }

      function hyphenate(a, b, c) {
        return b + "-" + c.toLowerCase();
      }

      function rgb2array(rgb_string, default_result) {
        var re = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
        var bits = re.exec(rgb_string);
        var result = default_result;
        if (bits)
          result = [ parseInt(bits[1]), parseInt(bits[2]), parseInt(bits[3]) ];
        return result;
      }

      function getCellStyles (cell) {
        var a = getStyle(cell, 'text-align');
        var fw = getStyle(cell, 'font-weight');
        var fs = getStyle(cell, 'font-style');
        var f = '';
        if (a == 'start')
          a = getStyle(cell, 'direction') == 'rtl' ? 'right' : 'left';
        if (fw >= 700)
          f = 'bold';
        if (fs == 'italic')
          f += fs;
        if (f == '')
          f = 'normal';

        var result = {
          style: {
            align: a,
            bcolor: rgb2array(getStyle(cell, 'background-color'), [255, 255, 255]),
            color: rgb2array(getStyle(cell, 'color'), [0, 0, 0]),
            fstyle: f
          },
          colspan: (parseInt($(cell).attr('colspan')) || 0),
          rowspan: (parseInt($(cell).attr('rowspan')) || 0)
        };

        if (cell !== null) {
          var r = cell.getBoundingClientRect();
          result.rect = {
            width: r.width,
            height: r.height
          };
        }

        return result;
      }

      // get computed style property
      function getStyle(target, prop) {
        try {
          if (window.getComputedStyle) { // gecko and webkit
            prop = prop.replace(/([a-z])([A-Z])/, hyphenate);  // requires hyphenated, not camel
            return window.getComputedStyle(target, null).getPropertyValue(prop);
          }
          if (target.currentStyle) { // ie
            return target.currentStyle[prop];
          }
          return target.style[prop];
        }
        catch (e) {
        }
        return "";
      }

      function getUnitValue(parent, value, unit) {
        var baseline = 100;  // any number serves

        var temp = document.createElement("div");  // create temporary element
        temp.style.overflow = "hidden";  // in case baseline is set too low
        temp.style.visibility = "hidden";  // no need to show it

        parent.appendChild(temp); // insert it into the parent for em, ex and %

        temp.style.width = baseline + unit;
        var factor = baseline / temp.offsetWidth;

        parent.removeChild(temp);  // clean up

        return (value * factor);
      }

      function getPropertyUnitValue(target, prop, unit) {
        var value = getStyle(target, prop);  // get the computed style value

        var numeric = value.match(/\d+/);  // get the numeric component
        if (numeric !== null) {
          numeric = numeric[0];  // get the string

          return getUnitValue (target.parentElement, numeric, unit);
        }
        return 0;
      }

      function downloadFile(filename, header, data) {

        var ua = window.navigator.userAgent;
        if (ua.indexOf("MSIE ") > 0 || !!ua.match(/Trident.*rv\:11\./)) {
          // Internet Explorer (<= 9) workaround by Darryl (https://github.com/dawiong/tableExport.jquery.plugin)
          // based on sampopes answer on http://stackoverflow.com/questions/22317951
          // ! Not working for json and pdf format !
          var frame = document.createElement("iframe");

          if (frame) {
            document.body.appendChild(frame);
            frame.setAttribute("style", "display:none");
            frame.contentDocument.open("txt/html", "replace");
            frame.contentDocument.write(data);
            frame.contentDocument.close();
            frame.focus();

            frame.contentDocument.execCommand("SaveAs", true, filename);
            document.body.removeChild(frame);
          }
        }
        else {
          var DownloadLink = document.createElement('a');

          if (DownloadLink) {
            DownloadLink.style.display = 'none';
            DownloadLink.download = filename;

            if (header.toLowerCase().indexOf("base64,") >= 0)
              DownloadLink.href = header + base64encode(data);
            else
              DownloadLink.href = header + encodeURIComponent(data);

            document.body.appendChild(DownloadLink);

            if (document.createEvent) {
              if (DownloadEvt == null)
                DownloadEvt = document.createEvent('MouseEvents');

              DownloadEvt.initEvent('click', true, false);
              DownloadLink.dispatchEvent(DownloadEvt);
            }
            else if (document.createEventObject)
              DownloadLink.fireEvent('onclick');
            else if (typeof DownloadLink.onclick == 'function')
              DownloadLink.onclick();

            document.body.removeChild(DownloadLink);
          }
        }
      }

      function utf8Encode(string) {
        string = string.replace(/\x0d\x0a/g, "\x0a");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
          var c = string.charCodeAt(n);
          if (c < 128) {
            utftext += String.fromCharCode(c);
          }
          else if ((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
          }
          else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
          }
        }
        return utftext;
      }

      function base64encode(input) {
        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = utf8Encode(input);
        while (i < input.length) {
          chr1 = input.charCodeAt(i++);
          chr2 = input.charCodeAt(i++);
          chr3 = input.charCodeAt(i++);
          enc1 = chr1 >> 2;
          enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
          enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
          enc4 = chr3 & 63;
          if (isNaN(chr2)) {
            enc3 = enc4 = 64;
          } else if (isNaN(chr3)) {
            enc4 = 64;
          }
          output = output +
                  keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                  keyStr.charAt(enc3) + keyStr.charAt(enc4);
        }
        return output;
      }

      return this;
    }
  });
})(jQuery);
/*
* bootstrap-table - v1.10.1 - 2016-02-17
* https://github.com/wenzhixin/bootstrap-table
* Copyright (c) 2016 zhixin wen
* Licensed MIT License
*/
!function(a){"use strict";a.fn.bootstrapTable.locales["zh-CN"]={formatLoadingMessage:function(){return"正在努力地加载数据中，请稍候……"},formatRecordsPerPage:function(a){return"每页显示 "+a+" 条记录"},formatShowingRows:function(a,b,c){return"显示第 "+a+" 到第 "+b+" 条记录，总共 "+c+" 条记录"},formatSearch:function(){return"搜索"},formatNoMatches:function(){return"没有找到匹配的记录"},formatPaginationSwitch:function(){return"隐藏/显示分页"},formatRefresh:function(){return"刷新"},formatToggle:function(){return"切换"},formatColumns:function(){return"列"}},a.extend(a.fn.bootstrapTable.defaults,a.fn.bootstrapTable.locales["zh-CN"])}(jQuery);