var budgetController = (function() {
  var Expense = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  var Income = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  var calculateBudget = function(type) {
    var sum = data.allItems[type].reduce(function(total, item){
      return total + item.value;
    }, 0);
    data.totals[type] = sum;
  };

  var data = {
    allItems: {
      exp: [],
      inc: []
    },
    totals: {
      exp: 0,
      inc: 0,
      budget: 0,
      percentage: -1
    }
  };

  return {
    addItem: function(type, des, val){
      var ID, newItem;
      
      // If there's at least one item in the items array, take id of last value
      if (data.allItems[type].length > 0) {
        ID = data.allItems[type][data.allItems[type].length - 1].id + 1
      } // otherwise it is the first item 
        else {
          ID = 1;
      }
 
      // If type is 'inc', create new Income object, else an Expense object
      newItem = type === 'inc' ?
        new Income(type, des, val) : new Expense(type, des, val);
      
      // Add items to items array of inc or exp
      data.allItems[type].push(newItem);
      // Adjust inc or exp totals
      data.totals[type] += val;

      return newItem;
    },
    deleteItem: function(type, id) {
      var ids, idx;
      
      // Represent the items in terms of their actual ids
      ids = data.allItems[type].map(function(item){
        return item.id
      });

      // Grab index of item in array 
      idx = ids.indexOf(id);

      // Lookup item in data structure and delete
      data.allItems[type].splice(idx, 1);
    },
    updateBudget: function() {
      // Calculate total income and expenses
      calculateBudget('inc');
      calculateBudget('exp');
      
      // Update total budget
      data.totals.budget = data.totals.inc - data.totals.exp;

      // Update expenses as percentage of income
      if (data.totals.inc > 0) {
        data.totals.percentage = Math.floor((data.totals.exp / data.totals.inc) * 100);
      }
    },
    getBudgetData: function() {
      return {
        total: data.totals.budget,
        totalIncome: data.totals.inc,
        totalExpenses: data.totals.exp,
        percentage: data.totals.percentage
      }
    },
    testing: function(){
      console.log(data);
    }
  }

})();

var UIController = (function () {
  var DOMStrings = {
    inputType: '.add__type',
    inputDescription: '.add__description',
    inputValue: '.add__value',
    inputButton: '.add__btn',
    incomeContainer: '.income__list',
    expensesContainer: '.expenses__list',
    budgetLabel: '.budget__value',
    incomeLabel: '.budget__income--value',
    expensesLabel: '.budget__expenses--value',
    percentageLabel: '.budget__expenses--percentage',
    container: '.container'
  }

  return {
    getInput: function() {
      return {
        type: document.querySelector(DOMStrings.inputType).value,
        description: document.querySelector(DOMStrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
      }
    },
    addListItem: function(item, type) {
      var html, newHtml, target;

      if (type === "inc") {
        target = document.querySelector(DOMStrings.incomeContainer);
        html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">+ %value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
      } else if (type === "exp") {
        target = document.querySelector(DOMStrings.expensesContainer);
        html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">- %value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
      }

      newHtml = html.replace("%id%", item.id);
      newHtml = newHtml.replace("%description%", item.description);
      newHtml = newHtml.replace("%value%", item.value);

      target.insertAdjacentHTML("beforeend", newHtml);

    },
    clearFields: function() {
      var fields, fieldsArr;
      // Get NodeList containing non-live input fields
      fields = document.querySelectorAll(DOMStrings.inputDescription + ', ' + DOMStrings.inputValue);
      // Convert NodeList to array with live input fields
      fieldsArr = Array.prototype.slice.call(fields);
      // Clear every input field's contents
      fieldsArr.forEach(function(field) {
        field.value = "";
      });
      // Add cursor to first input field
      fieldsArr[0].focus();
    },
    updateBudget: function(budgetData) {
      document.querySelector(DOMStrings.budgetLabel).textContent = budgetData.total;
      document.querySelector(DOMStrings.incomeLabel).textContent = budgetData.totalIncome;
      document.querySelector(DOMStrings.expensesLabel).textContent = budgetData.totalExpenses;
      // If costs > income or there are no costs at all, percentage should not be displayed
      if (budgetData.percentage > 0) {
        document.querySelector(DOMStrings.percentageLabel).textContent = budgetData.percentage;
      } else {
        document.querySelector(DOMStrings.percentageLabel).textContent = "-";
      }
    },
    getDOMStrings: function() {
      return DOMStrings;
    }
  }
})();

var controller = (function (model, view) {

  var setupEventListeners = function() {
    var DOM = view.getDOMStrings();
    // If add button is clicked, fire ctrlAddItem funciton
    document.querySelector(DOM.inputButton).addEventListener('click', ctrlAddItem);
    // If enter/return key is pressed, fire ctrlAddItem funciton
    document.addEventListener('keypress', function (e) {
      if (e.keyCode === 13 || e.which === 13) {
        ctrlAddItem();
      }
    });

    // Event delegator for delete buttons on income/expense items
    document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
  };

  var updateBudget = function() {
    var budgetData;
    // Update data in budgetController
    budgetController.updateBudget(); 
    // Return the budget total
    budgetData = budgetController.getBudgetData();
    // Display the budget data in the UI
    UIController.updateBudget(budgetData);
  };

  var ctrlAddItem = function() {
    var input, item;
    // Get input fiels data
    input = view.getInput();

    if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
      // Add item to budget controller and assign it here
      item = budgetController.addItem(input.type, input.description, input.value);
      // Add item to UI
      UIController.addListItem(item, input.type);
      // Clear fields after submitting
      UIController.clearFields();
    }  

    updateBudget();
  };

  var ctrlDeleteItem = function(e) {
    var itemID, splitID, type, ID;
    
    itemID = e.target.parentNode.parentNode.parentNode.parentNode.id;

    if (itemID) {
      splitID = itemID.split('-');
      type = splitID[0];
      // Convert ID from string to number
      ID = +splitID[1];
    }
    console.log(type);
    // Delete item from data
    budgetController.deleteItem(type, ID);
    // Delete item form UI

    // Update budget totals

  };

  return {
    init: function() {
      console.log('App has started.');
      UIController.updateBudget({
        total: 0,
        totalIncome: 0,
        totalExpenses: 0,
        percentage: -1
      })
      setupEventListeners();
    }
  }

})(budgetController, UIController);

controller.init();