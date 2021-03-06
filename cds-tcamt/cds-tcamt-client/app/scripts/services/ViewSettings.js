/**
 * Created by haffo on 5/4/15.
 */

angular.module('tcl').factory('ViewSettings',
    ['StorageService', function (StorageService) {
        var columnOptions = [
            { id: "usage", label: "Usage"},
            { id: "cardinality", label: "Cardinality"},
            { id: "length", label: "Length"},
            { id: "confLength", label: "Conf. Length"},
            { id: "datatype", label: "Datatype"},
            { id: "valueSet", label: "Value Set"},
            { id: "predicate", label: "Predicate"},
            { id: "confStatement", label: "Conf. Statement"},
            { id: "defText", label: "Defin. Text"},
            { id: "comment", label: "Comment"}
        ];
        var visibleColumns = StorageService.get(StorageService.TABLE_COLUMN_SETTINGS_KEY) == null ? angular.copy(columnOptions) : angular.fromJson(StorageService.get(StorageService.TABLE_COLUMN_SETTINGS_KEY));
        var ViewSettings = {
            columnOptions: columnOptions,
            visibleColumns: visibleColumns,
            translations: {buttonDefaultText: 'Visible Columns'},
            extra: {displayProp: 'label', buttonClasses: 'btn btn-xs btn-primary', showCheckAll: false, showUncheckAll: false, scrollable: false},
            tableRelevance:StorageService.get(StorageService.TABLE_RELEVANCE_SETTINGS) == null ? false : StorageService.get(StorageService.TABLE_RELEVANCE_SETTINGS),
            tableConcise:StorageService.get(StorageService.TABLE_CONCISE_SETTINGS) == null ? false : StorageService.get(StorageService.TABLE_CONCISE_SETTINGS),
            tableCollapse:StorageService.get(StorageService.TABLE_COLLAPSE_SETTINGS) == null ? true : StorageService.get(StorageService.TABLE_COLLAPSE_SETTINGS),
            tableReadonly:StorageService.get(StorageService.TABLE_READONLY_SETTINGS) == null ? false : StorageService.get(StorageService.TABLE_READONLY_SETTINGS),
            events: {
                onItemSelect: function (item) {
                    ViewSettings.setVisibleColumns();
                },
                onItemDeselect: function (item) {
                    ViewSettings.setVisibleColumns();
                }
            },

            setVisibleColumns: function () {
                StorageService.set(StorageService.TABLE_COLUMN_SETTINGS_KEY, angular.toJson(ViewSettings.visibleColumns));
            },
            setTableConcise: function (concise) {
                ViewSettings.tableConcise = concise;
                StorageService.set(StorageService.TABLE_CONCISE_SETTINGS, ViewSettings.tableConcise);
            },
            setTableRelevance: function (relevance) {
                ViewSettings.tableRelevance = relevance;
                StorageService.set(StorageService.TABLE_RELEVANCE_SETTINGS, ViewSettings.tableRelevance);
            },
            setTableCollapse: function (collapse) {
                ViewSettings.tableCollapse = collapse;
                StorageService.set(StorageService.TABLE_COLLAPSE_SETTINGS, ViewSettings.tableCollapse);
            },
            setTableReadonly: function (value) {
                ViewSettings.tableReadonly = value;
                StorageService.set(StorageService.TABLE_READONLY_SETTINGS, ViewSettings.tableReadonly);
            },
            isVisibleColumn: function (column) {
                for (var i = 0; i < ViewSettings.visibleColumns.length; i++) {
                    if (ViewSettings.visibleColumns[i].id === column) {
                        return true;
                    }
                }
                return false;
            }
        };
        return ViewSettings;
    }]);

