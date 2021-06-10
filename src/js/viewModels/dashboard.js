define(
  ['accUtils',
   'knockout',
   'ojs/ojmodel',
   'ojs/ojcollectiondataprovider',
   'ojs/ojlabel',
   'ojs/ojchart',
   'ojs/ojlistview',
   'ojs/ojavatar',
   'ojs/ojselectcombobox',
   'ojs/ojconverterutils-i18n',
   'ojs/ojdatetimepicker',
   'ojs/ojbootstrap'
  ],
  function (accUtils, ko, Model, CollectionDataProvider, Bootstrap, ConverterUtilsI18n) {

    function DashboardViewModel() {
      var self = this;  //generated code

      /**
       * Declare observables and read data from REST service
       */
      //var url = "js/store_data.json";  //defines link to local data file

      // Master list and detail list observables
      self.areaDataProvider = ko.observable();   //gets data for Areas list
      self.dateDataProvider = ko.observable();      //gets data for Dates list
      
      self.dateData = ko.observable('');             //holds data for Date details
      self.caseDataSum = ko.observable(''); 
      self.caseDataIncRate = ko.observable(''); 
      self.caseDataPreWeek = ko.observable(''); 
      self.barSeriesValue=ko.observableArray([]);

      // Area selection observables
      self.areaSelected = ko.observable(false);
      self.selectedArea = ko.observable();
      self.firstSelectedArea = ko.observable();
      
      // Date selection observables
      self.dateSelected = ko.observable(false);
      self.selectedDate = ko.observable();
      self.firstSelectedDate = ko.observable();
      
      //REST endpoint
      var RESTurl = "https://api.coronavirus.data.gov.uk/v2/data?areaType=nation&metric=newCasesByPublishDate&metric=transmissionRateGrowthRateMax&metric=transmissionRateGrowthRateMin&metric=transmissionRateMax&metric=transmissionRateMin&format=json";
      
       var dataArr; 
       fetch(RESTurl)
         .then(response => response.json())
            .then(data => {
                dataArr= data;
                console.log(dataArr);
            });  
    
   
      //Single line of data
      var areaModel = Model.Model.extend({
        urlRoot: RESTurl,
        idAttribute: 'areaCode'
      });

      //Multiple models i.e. multiple lines of data
      var areaCollection = new Model.Collection.extend({
        url: RESTurl,
        model: areaModel,
        comparator: 'areaCode'
      });
 
      /*
      *An observable called activityDataProvider is already bound in the View file
      *from the JSON example, so you don't need to update dashboard.html
      */
      self.myAreaCol = new areaCollection();
      self.areaDataProvider(new CollectionDataProvider(self.myAreaCol));

      /**
       * Handle selection from Areas list
       */
      self.selectedAreaChanged = function (event) {
        // Check whether click is an Activity selection or a deselection
        if (event.detail.value.length != 0) {
          // If selection, populate and display list
          // Create variable for items list using firstSelectedXxx API from List View
          // Populate items list using DataProvider fetch on key attribute
          // self.dateDataProvider(new ArrayDataProvider(datesArray, { keyAttributes: 'id' }))
          var areaKey = self.firstSelectedArea().data.areaCode;
          //REST endpoint for the items list
          var url = "https://api.coronavirus.data.gov.uk/v2/data?areaType=nation&areaCode="+ areaKey +"&metric=newCasesByPublishDate&metric=transmissionRateGrowthRateMax&metric=transmissionRateGrowthRateMin&metric=transmissionRateMax&metric=transmissionRateMin&format=json";
         
          function parseDate(response) {
           
            if (response) {
                                          
              return {
                areaName: response['areaName'],
                areaCode: response['areaCode'], 
                date: response['date'],
                newCasesByPublishDate: response['newCasesByPublishDate'],
                transmissionRateMax: response['transmissionRateMax'],
                transmissionRateMin: response['transmissionRateMin']
                
                    };
                }
             }

          
          var dateModel = Model.Model.extend({
            urlRoot: url,
            parse: parseDate,
            idAttribute: 'date'
          });

          self.myDate = new dateModel();
          self.dateCollection = new Model.Collection.extend({
            url: url,
            model: self.myDate,
            comparator: 'date'
          });
 
          /*
          *An observable called dateDataProvider is already bound in the View file
          *from the JSON example, so you don't need to update dashboard.html
          */
          self.myDateCol = new self.dateCollection();
          self.dateDataProvider(new CollectionDataProvider(self.myDateCol));
  
          // Set List View properties
          self.areaSelected(true);
          self.dateSelected(false);
          // Clear item selection
          self.selectedDate([]);
          self.dateData();
        }  else {
          // If deselection, hide list
          self.areaSelected(false);
          self.dateSelected(false);
        }
      };

      /**
       * Handle selection from Area's Dates list
       */
      self.selectedDateChanged = function (event) {
           
        // Check whether click is an Area Date selection or deselection
        if (event.detail.value.length != 0) {
          // If selection, populate and display Item details
          // Populate dates list observable using firstSelectedXxx API
          self.dateData(self.firstSelectedDate().data);
          // Create variable and get attributes of the items list to set bar chart values
              
          //find the Mondays to calculate the average and total cases         
          var day1= self.firstSelectedDate().data.date;
         
          var day2= new Date(day1);
          var day3= new Date(day2-(7*24*60*60*1000));
          var day4= day3.toISOString();
          var day5= day4.toString();
          var day6= day5.slice(0,10);
         
        /* //holds data for the previous week details
         self.totalArr = ko.observable([]);   
         self.sum = ko.observable(''); 
         self.incRate = ko.observable(''); 
         self.preWeekData=ko.observableArray([]); */
         
         //holds data for calender view
      
        let preWeekData=dataArr.body.filter(function (x) {return x.date === day6 & x.areaCode=== self.firstSelectedArea().data.areaCode; });
        console.log(preWeekData);
        console.log(preWeekData.length);
        
        let totalArr = dataArr.body.filter(x => x.date<= self.firstSelectedDate().data.date & x.areaCode=== self.firstSelectedArea().data.areaCode);
        let sum = totalArr.reduce((accumulator, currentValue) => {return accumulator + currentValue.newCasesByPublishDate;}, 0);
        let incRate;                
        if(preWeekData.length !== 0){            
            incRate= Math.floor((self.dateData().newCasesByPublishDate - preWeekData[0].newCasesByPublishDate)/preWeekData[0].newCasesByPublishDate*100);
            } else{
                preWeekData.push( {areaCode: self.firstSelectedArea().data.areaCode, date: self.firstSelectedArea().data.date, newCasesByPublishDate: 0});
                incRate= 0;};
            
                console.log(totalArr);
                console.log(sum);
                console.log(incRate);
                console.log(preWeekData[0].newCasesByPublishDate);
            
            self.caseDataSum(sum);
            self.caseDataIncRate(incRate);
            self.caseDataPreWeek(preWeekData[0].newCasesByPublishDate);
                      
         var barSeries=[
            { name: "New Cases Today", items: [self.dateData().newCasesByPublishDate] },
            { name: "New Cases Same Day Previous Week", items: [self.caseDataPreWeek()] },
            { name: "Transmission Rate Max", items: [self.dateData().transmissionRateMax] },
            { name: "Transmission Rate Min", items: [self.dateData().transmissionRateMin] }
          //{ name: "Transmission Rate", items: [Math.floor(((self.dateData().transmissionRateMax)+(self.dateData().transmissionRateMax))/2)] },
          ];
                    
          // Update the pie chart with the data
          self.barSeriesValue(barSeries);
          // Set List View properties
          self.dateSelected(true);
         // self.selectedCase([]);
        } else {
          // If deselection, hide list
          self.dateSelected(false);
        }
      };
 
      // The following 3 functions are not addressed in this tutorial.
	  
      // Below are a set of the ViewModel methods invoked by the oj-module component.
      // Please reference the oj-module jsDoc for additional information.

      /**
       * This section is standard navdrawer starter template code
       */

      // Below are a set of the ViewModel methods invoked by the oj-module component.
      // Please reference the oj-module jsDoc for additional information.

      /**
       * Optional ViewModel method invoked after the View is inserted into the
       * document DOM.  The application can put logic that requires the DOM being
       * attached here. 
       * This method might be called multiple times - after the View is created 
       * and inserted into the DOM and after the View is reconnected 
       * after being disconnected.
       */
      self.connected = function () {
        accUtils.announce('Dashboard page loaded.', 'assertive');
        document.title = "Dashboard";
        // Implement further logic if needed
      };

      /**
       * Optional ViewModel method invoked after the View is disconnected from the DOM.
       */
      self.disconnected = function () {
        // Implement if needed
      };

      /**
       * Optional ViewModel method invoked after transition to the new View is complete.
       * That includes any possible animation between the old and the new View.
       */
      self.transitionCompleted = function () {
        // Implement if needed
      };
    }

    /*
     * Returns a constructor for the ViewModel so that the ViewModel is constructed
     * each time the view is displayed.  Return an instance of the ViewModel if
     * only one instance of the ViewModel is needed.
     */
    return new DashboardViewModel();
  }
);