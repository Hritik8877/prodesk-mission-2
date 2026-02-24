(function() {
  let totalSalary = 0;
  let expenses = []; 

  const salaryInput = document.getElementById('salaryInput');
  const salaryDisplay = document.getElementById('salaryDisplay');
  const expenseNameInput = document.getElementById('expenseNameInput');
  const expenseAmountInput = document.getElementById('expenseAmountInput');
  const addBtn = document.getElementById('addExpenseBtn');
  const expenseListDiv = document.getElementById('expenseListContainer');
  const remainingSpan = document.getElementById('remainingBalanceDisplay');

  let pieChart = null;
  const ctx = document.getElementById('balancePieChart').getContext('2d');


  function generateId() { return Date.now() + '-' + Math.random().toString(36).substring(2, 8); }

  const STORAGE_KEY = 'cashflow_tracker';

  function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (typeof data.totalSalary === 'number') totalSalary = data.totalSalary;
        if (Array.isArray(data.expenses)) {
          expenses = data.expenses.filter(e => e && typeof e.name === 'string' && typeof e.amount === 'number' && e.id).map(e => ({
            id: e.id,
            name: e.name,
            amount: e.amount
          }));
        } else {
          expenses = [];
        }
      } catch (e) {
        console.warn('Failed to load storage', e);
        totalSalary = 0;
        expenses = [];
      }
    }
  }

  function saveToStorage() {
    const data = { totalSalary, expenses };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function refreshUI() {
    salaryDisplay.textContent = totalSalary.toFixed(2);

    if (expenses.length === 0) {
      expenseListDiv.innerHTML = `<div class="empty-message"><i class="fa-regular fa-receipt"></i> no expenses yet</div>`;
    } else {
      let htmlStr = '';
      expenses.forEach(exp => {
        htmlStr += `
          <div class="expense-item" data-id="${exp.id}">
            <div class="expense-info">
              <span class="expense-name">${escapeHtml(exp.name)}</span>
              <span class="expense-amount">$${exp.amount.toFixed(2)}</span>
            </div>
            <button class="delete-btn" data-id="${exp.id}" title="delete expense"><i class="fas fa-trash-alt"></i></button>
          </div>
        `;
      });
      expenseListDiv.innerHTML = htmlStr;

      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          deleteExpenseById(id);
        });
      });
    }

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = totalSalary - totalExpenses;
    remainingSpan.textContent = remaining.toFixed(2);
    remainingSpan.style.color = remaining < 0 ? '#ffb0a5' : '#b8f3d6';

    updatePieChart(remaining, totalExpenses);
    validateAddButton();

    
    saveToStorage();
  }

  function escapeHtml(unsafe) {
    return unsafe.replace(/[&<>"]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      if (m === '"') return '&quot;';
      return m;
    });
  }

  function deleteExpenseById(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    refreshUI();
  }

  function updatePieChart(remaining, totalExpenses) {
    if (pieChart) pieChart.destroy();

    const dataValues = [Math.max(remaining, 0), totalExpenses];
    const labels = ['Remaining', 'Expenses'];
    const backgroundColors = ['#46b598', '#f1967b'];

    pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: backgroundColors,
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` $${ctx.raw.toFixed(2)}` } }
        },
        layout: { padding: 6 }
      }
    });
  }

  function validateAddButton() {
    const nameVal = expenseNameInput.value.trim();
    const amountVal = expenseAmountInput.value.trim();
    let isValid = true;

    if (nameVal === '') isValid = false;
    const amountNum = parseFloat(amountVal);
    if (isNaN(amountNum) || amountNum <= 0) isValid = false;

    addBtn.disabled = !isValid;
  }


  salaryInput.addEventListener('input', (e) => {
    const rawValue = e.target.value.trim();
    if (rawValue === '') {
      totalSalary = 0;
    } else {
      const parsed = parseFloat(rawValue);
      totalSalary = isNaN(parsed) ? totalSalary : Math.max(0, parsed);
    }
    refreshUI();
  });

  expenseNameInput.addEventListener('input', validateAddButton);
  expenseAmountInput.addEventListener('input', validateAddButton);

  addBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const name = expenseNameInput.value.trim();
    const amountRaw = expenseAmountInput.value.trim();
    if (name === '' || amountRaw === '') return;

    const amount = parseFloat(amountRaw);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    const newExpense = {
      id: generateId(),
      name: name,
      amount: amount
    };
    expenses.push(newExpense);

    expenseNameInput.value = '';
    expenseAmountInput.value = '';
    refreshUI();
    expenseNameInput.focus();
  });


  [salaryInput, expenseAmountInput].forEach(inp => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === '-' || e.key === 'e') {
        e.preventDefault();
      }
    });
  });

 
  loadFromStorage();
  if (totalSalary > 0) {
    salaryInput.value = totalSalary;
  } else {
    salaryInput.value = '';
  }
  refreshUI();
  validateAddButton();
})();