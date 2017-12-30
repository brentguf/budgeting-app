/* ============

    Model 

============ */

var budgetController = (function() {
  var Expense = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  Expense.prototype.calculatePercentage = function(totalIncome) {
   
    if (totalIncome > 0) {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  }

  Expense.prototype.getPercentage = function() {
    return this.percentage;
  } 

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
        new Income(ID, des, val) : new Expense(ID, des, val);
      
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
        return item.id;
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

      // Update total expenses as percentage of total income
      if (data.totals.inc > 0) {
        data.totals.percentage = Math.floor((data.totals.exp / data.totals.inc) * 100);
      }
    },
    calculatePercentages: function() {
      // Calculate each expense as percentage of total income and add to item
      data.allItems['exp'].forEach(function(item) {
        item.calculatePercentage(data.totals.inc);
      });
    },
    getBudgetData: function() {
      return {
        total: data.totals.budget,
        totalIncome: data.totals.inc,
        totalExpenses: data.totals.exp,
        percentage: data.totals.percentage
      }
    },
    getPercentages: function() {
      var percentages;
      
      percentages = data.allItems['exp'].map(function (item) {
        return item.getPercentage();
      });

      return percentages;
    },
    testing: function(){
      console.log(data);
    }
  }

})();

/* ============

    View 

============ */

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
    container: '.container',
    expensePercentageLabel: '.item__percentage',
    dateLabel: '.budget__title--month'
  }

  var formatNumber = function(num, type) {
    var numParts = [], splitNum, int, dec, formattedNum;
    
    // Remove sign of number (abs), round to 2 decimals and convert to string (toFixed) so we can use string methods on it
    num = Math.abs(num);
    num = num.toFixed(2);
    
    // Split the integer and decimal part
    splitNum = num.split('.');
    int = splitNum[0]
    dec = splitNum[1];

    while (int.length > 0) {
      // If the number consists of 3 or more figures, add 3 last to numParts, followed by a comma
      if (int.length > 3) {
        numParts.unshift(int.substr(int.length - 3))
        numParts.unshift(',');
      } // Else, there are 3 figures left at most, so add them ass to numParts
      else {
        numParts.unshift(int.substr(0));
      }
      // Cut off the part we just added to numParts from num and continue this loop until we've gone over the entire num
      int = int.substr(0, int.length - 3);
    }

    // Bring the different parts of our number back together 
    formattedNum = numParts.join('') + '.' + dec;

    // If it's an income, return a +, else add a -, followed by a space and the number
    return (type === 'inc' ? '+' : '-') + ' ' + formattedNum;
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
        html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
      } else if (type === "exp") {
        target = document.querySelector(DOMStrings.expensesContainer);
        html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
      }

      newHtml = html.replace("%id%", item.id);
      newHtml = newHtml.replace("%description%", item.description);
      newHtml = newHtml.replace("%value%", formatNumber(item.value, type));

      target.insertAdjacentHTML("beforeend", newHtml);

    },
    deleteListItem: function(itemID) {
      var el;
      // Lookup item in DOM
      el = document.getElementById(itemID);
      // Move one level up, so we can delete the element from the DOM
      el.parentNode.removeChild(el);
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
    displayBudget: function(budgetData) {
      var total;
      
      total = budgetData.total >= 0 ?
         formatNumber(budgetData.total, 'inc') : formatNumber(budgetData.total, 'exp');

      document.querySelector(DOMStrings.budgetLabel).textContent = total;
      document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(budgetData.totalIncome, 'inc');
      document.querySelector(DOMStrings.expensesLabel).textContent = formatNumber(budgetData.totalExpenses, 'exp');
      // If costs > income or there are no costs at all, percentage should not be displayed
      if (budgetData.percentage > 0) {
        document.querySelector(DOMStrings.percentageLabel).textContent = budgetData.percentage + '%';
      } else {
        document.querySelector(DOMStrings.percentageLabel).textContent = "-";
      }
    },
    displayPercentages: function(percentages) {
      var expensePercentageLabels;
      // Grab all div's that display the percentages
      expensePercentageLabels = document.querySelectorAll(DOMStrings.expensePercentageLabel);
      // Loop over div's and insert their percentage
      expensePercentageLabels.forEach(function(label, i) {
        if (percentages[i] > 0) {
          label.textContent = percentages[i].toString() + '%';
        } else {
          label.textContent = '-';
        }
      });
    },
    displayDate: function() {
      var date, year, month;
      var months = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
      ];

      // Get current date
      date = new Date();
      // Get year
      year = date.getFullYear();
      // Get month (zero-indexed)
      month = months[date.getMonth()]

      // Grab date label and set date
      document.querySelector(DOMStrings.dateLabel).textContent = month + ' ' + year;
    },
    changeType: function() {
      var fields = document.querySelectorAll(
        DOMStrings.inputType + ',' + 
        DOMStrings.inputDescription + ',' +
        DOMStrings.inputValue
      );

      fields.forEach(function(el){ 
        el.classList.toggle('red-focus');
      });

      document.querySelector(DOMStrings.inputButton).classList.toggle('red');
    },
    getDOMStrings: function() {
      return DOMStrings;
    }
  }
})();

/* ============

  Controller 

============ */

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

    document.querySelector(DOM.inputType).addEventListener('change', UIController.changeType);
  };

  var updateBudget = function() {
    var budgetData;
    // Update data in budgetController
    budgetController.updateBudget(); 
    // Return the budget total
    budgetData = budgetController.getBudgetData();
    // Display the updated budget data in the UI
    UIController.displayBudget(budgetData);
  };

  var updatePercentages = function() {
    var percentages;
    // Update percentages in data
    budgetController.calculatePercentages();
    // Get percentages from data
    percentages = budgetController.getPercentages();
    // // Update UI percentages
    UIController.displayPercentages(percentages);
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
    updatePercentages();
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
    UIController.deleteListItem(itemID);

    updateBudget();
    updatePercentages();
  };

  return {
    init: function() {
      console.log('App has started.');
      UIController.displayDate();
      UIController.displayBudget({
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