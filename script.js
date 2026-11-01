// ======================================================
// EXPENSE SPLITTER - COMPLETE JAVASCRIPT
// ======================================================


// ================= SECTION NAVIGATION =================

function showSection(sectionId) {

    document.querySelectorAll(".page-section").forEach(function(section) {
        section.classList.add("hidden");
    });

    const selectedSection = document.getElementById(sectionId);

    if (selectedSection) {
        selectedSection.classList.remove("hidden");
    }

    document.querySelectorAll(".menu-item").forEach(function(button) {
        button.classList.remove("active");
    });

    const buttons = document.querySelectorAll(".menu-item");

    buttons.forEach(function(button) {

        const onclickText = button.getAttribute("onclick");

        if (onclickText && onclickText.includes("'" + sectionId + "'")) {
            button.classList.add("active");
        }
    });
}

window.showSection = showSection;


// ================= GET HTML ELEMENTS =================

const form = document.getElementById("expenseForm");

const descriptionInput =
    document.getElementById("description");

const amountInput =
    document.getElementById("amount");

const categoryInput =
    document.getElementById("category");

const participantsInput =
    document.getElementById("participants");

const paidBySelect =
    document.getElementById("paidBy");

const resultBox =
    document.getElementById("result");

const historyBox =
    document.getElementById("expenseHistory");

const totalSpentBox =
    document.getElementById("totalSpent");

const friendCountBox =
    document.getElementById("friendCount");

const averageExpenseBox =
    document.getElementById("averageExpense");

const highestCategoryBox =
    document.getElementById("highestCategory");

const highestCategoryAmountBox =
    document.getElementById("highestCategoryAmount");

const categoryLegend =
    document.getElementById("categoryLegend");

const chartTotal =
    document.getElementById("chartTotal");

const quickInsights =
    document.getElementById("quickInsights");

const friendsList =
    document.getElementById("friendsList");

const expenseCountBox =
    document.getElementById("expenseCount");

const analyticsTotalBox =
    document.getElementById("analyticsTotal");

const analyticsHighestBox =
    document.getElementById("analyticsHighest");


// ================= CHART =================

let categoryChart = null;


// ================= CATEGORY EMOJIS =================

function getCategoryEmoji(category) {

    const emojis = {
        "Lunch": "🍔",
        "Dinner": "🍽️",
        "Travel": "🚕",
        "Hotel": "🏨",
        "Shopping": "🛍️",
        "Entertainment": "🎬",
        "College": "📚",
        "Other": "📦"
    };

    return emojis[category] || "📦";
}


// ================= UPDATE WHO PAID =================

function updatePaidByDropdown() {

    const input =
        document.getElementById("participants");

    const select =
        document.getElementById("paidBy");

    if (!input || !select) {
        return;
    }

    const names = input.value
        .split(",")
        .map(function(name) {
            return name.trim();
        })
        .filter(function(name) {
            return name !== "";
        });

    const uniqueNames = [...new Set(names)];

    select.innerHTML = "";

    if (uniqueNames.length === 0) {

        const option =
            document.createElement("option");

        option.value = "";
        option.textContent = "Enter names first";

        select.appendChild(option);

        return;
    }

    uniqueNames.forEach(function(name) {

        const option =
            document.createElement("option");

        option.value = name;
        option.textContent = name;

        select.appendChild(option);
    });
}

window.updatePaidByDropdown =
    updatePaidByDropdown;


// ================= LOAD EXPENSES =================

async function loadExpenses() {

    try {

        const response =
            await fetch("/api/expenses");

        if (!response.ok) {
            throw new Error("Failed to load expenses");
        }

        const expenses =
            await response.json();

        displayExpenses(expenses);

        updateDashboard(expenses);

        updateFriends(expenses);

        updateAnalytics(expenses);

    } catch (error) {

        console.error(
            "Loading expenses error:",
            error
        );

        if (historyBox) {

            historyBox.innerHTML = `
                <div class="empty-history">
                    <h3>Unable to load expenses</h3>
                    <p>Make sure the server is running.</p>
                </div>
            `;
        }
    }
}


// ================= DISPLAY EXPENSE HISTORY =================

function displayExpenses(expenses) {

    if (!historyBox) {
        return;
    }

    if (!expenses || expenses.length === 0) {

        historyBox.innerHTML = `
            <div class="empty-history">
                <h3>No expenses added yet</h3>
                <p>Add your first shared expense.</p>
            </div>
        `;

        return;
    }

    historyBox.innerHTML = "";

    expenses.forEach(function(expense) {

        const amount =
            Number(expense.amount) || 0;

        const participants =
            Array.isArray(expense.participants)
                ? expense.participants
                : [];

        const eachShare =
            participants.length > 0
                ? amount / participants.length
                : 0;

        const card =
            document.createElement("div");

        card.className = "expense-history-card";

        card.innerHTML = `
            <div class="history-main">

                <div class="history-icon">
                    ${getCategoryEmoji(expense.category)}
                </div>

                <div>

                    <h3>
                        ${escapeHTML(expense.description)}
                    </h3>

                    <p>
                        ${escapeHTML(expense.category || "Other")}
                    </p>

                    <small>
                        Paid by:
                        <strong>
                            ${escapeHTML(expense.paidBy || "")}
                        </strong>
                    </small>

                </div>

            </div>

            <div class="history-details">

                <strong>
                    ₹${amount.toFixed(2)}
                </strong>

                <span>
                    ${participants.length} people
                </span>

                <small>
                    ₹${eachShare.toFixed(2)} each
                </small>

                <button
                    class="delete-btn"
                    onclick="deleteExpense('${expense._id}')"
                >
                    🗑️ Delete
                </button>

            </div>
        `;

        historyBox.appendChild(card);
    });
}


// ================= UPDATE DASHBOARD =================

function updateDashboard(expenses) {

    if (!expenses) {
        expenses = [];
    }

    const total =
        expenses.reduce(function(sum, expense) {

            return sum + (Number(expense.amount) || 0);

        }, 0);

    const count =
        expenses.length;

    const average =
        count > 0
            ? total / count
            : 0;

    const friends = new Set();

    expenses.forEach(function(expense) {

        if (Array.isArray(expense.participants)) {

            expense.participants.forEach(function(name) {

                if (name && name.trim() !== "") {
                    friends.add(name.trim());
                }

            });

        }

    });


    // Category totals

    const categoryTotals = {};

    expenses.forEach(function(expense) {

        const category =
            expense.category || "Other";

        const amount =
            Number(expense.amount) || 0;

        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }

        categoryTotals[category] += amount;

    });


    // Highest category

    let highestCategory = "-";

    let highestAmount = 0;

    Object.keys(categoryTotals).forEach(function(category) {

        if (categoryTotals[category] > highestAmount) {

            highestAmount =
                categoryTotals[category];

            highestCategory =
                category;
        }

    });


    // Update cards

    if (totalSpentBox) {
        totalSpentBox.textContent =
            "₹" + total.toFixed(2);
    }

    if (friendCountBox) {
        friendCountBox.textContent =
            friends.size;
    }

    if (averageExpenseBox) {
        averageExpenseBox.textContent =
            "₹" + average.toFixed(2);
    }

    if (highestCategoryBox) {
        highestCategoryBox.textContent =
            highestCategory;
    }

    if (highestCategoryAmountBox) {
        highestCategoryAmountBox.textContent =
            "₹" + highestAmount.toFixed(2);
    }


    updateCategoryChart(
        categoryTotals,
        total
    );


    updateQuickInsights(
        expenses,
        total,
        highestCategory,
        highestAmount,
        friends.size
    );
}


// ================= CATEGORY DONUT CHART =================

function updateCategoryChart(categoryTotals, total) {

    const canvas =
        document.getElementById("categoryChart");

    if (!canvas) {
        return;
    }

    const categories =
        Object.keys(categoryTotals);

    const amounts =
        categories.map(function(category) {
            return categoryTotals[category];
        });


    if (categoryChart) {

        categoryChart.destroy();

        categoryChart = null;
    }


    if (categories.length === 0) {

        if (chartTotal) {
            chartTotal.textContent = "₹0";
        }

        if (categoryLegend) {

            categoryLegend.innerHTML = `
                <p class="no-data">
                    Add expenses to see analytics.
                </p>
            `;
        }

        return;
    }


    if (chartTotal) {

        chartTotal.textContent =
            "₹" + total.toFixed(0);
    }


    categoryChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: categories,

                datasets: [
                    {
                        data: amounts,
                        
                        backgroundColor: [
                            "#6366F1",
                            "#EC4899",
                            "#F59E0B",
                            "#8B5CF6",
                            "#00B894",
                            "#FF6B6B",
                            "#4B5563",
                            "#F97316"
                        ],

                        borderWidth: 3,

                        borderColor: "#ffffff"
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "68%",

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                const value =
                                    context.raw || 0;

                                const percentage =
                                    total > 0
                                        ? ((value / total) * 100)
                                            .toFixed(1)
                                        : 0;

                                return (
                                    " ₹" +
                                    value.toFixed(2) +
                                    " (" +
                                    percentage +
                                    "%)"
                                );
                            }
                        }
                    }
                }
            }
        });


    // Create legend

    if (categoryLegend) {

        categoryLegend.innerHTML = "";

        categories.forEach(function(category) {

            const amount =
                categoryTotals[category];

            const percentage =
                total > 0
                    ? ((amount / total) * 100).toFixed(1)
                    : 0;

            const item =
                document.createElement("div");

            item.className =
                "category-item";

            item.innerHTML = `

                <div class="category-item-left">

                    <span class="category-dot"></span>

                    <div>

                        <strong>
                            ${getCategoryEmoji(category)}
                            ${escapeHTML(category)}
                        </strong>

                        <small>
                            ${percentage}% of spending
                        </small>

                    </div>

                </div>

                <strong>
                    ₹${amount.toFixed(2)}
                </strong>
            `;

            categoryLegend.appendChild(item);
        });
    }
}


// ================= QUICK INSIGHTS =================

function updateQuickInsights(
    expenses,
    total,
    highestCategory,
    highestAmount,
    friendCount
) {

    if (!quickInsights) {
        return;
    }

    if (expenses.length === 0) {

        quickInsights.innerHTML = `
            <div class="insight">

                <div class="insight-icon">
                    ⭐
                </div>

                <div>

                    <strong>
                        No expenses yet
                    </strong>

                    <p>
                        Add an expense to generate insights.
                    </p>

                </div>

            </div>
        `;

        return;
    }


    const average =
        total / expenses.length;


    quickInsights.innerHTML = `

        <div class="insight">

            <div class="insight-icon">
                💰
            </div>

            <div>

                <strong>
                    Total spending
                </strong>

                <p>
                    You have spent
                    ₹${total.toFixed(2)}
                    so far.
                </p>

            </div>

        </div>


        <div class="insight">

            <div class="insight-icon">
                ⭐
            </div>

            <div>

                <strong>
                    Highest category
                </strong>

                <p>
                    ${getCategoryEmoji(highestCategory)}
                    ${escapeHTML(highestCategory)}
                    with ₹${highestAmount.toFixed(2)}.
                </p>

            </div>

        </div>


        <div class="insight">

            <div class="insight-icon">
                👥
            </div>

            <div>

                <strong>
                    Friends
                </strong>

                <p>
                    ${friendCount}
                    people are included.
                </p>

            </div>

        </div>


        <div class="insight">

            <div class="insight-icon">
                📊
            </div>

            <div>

                <strong>
                    Average expense
                </strong>

                <p>
                    ₹${average.toFixed(2)}
                    per expense.
                </p>

            </div>

        </div>

    `;
}


// ================= FRIENDS =================

function updateFriends(expenses) {

    if (!friendsList) {
        return;
    }

    const friends = new Set();

    expenses.forEach(function(expense) {

        if (Array.isArray(expense.participants)) {

            expense.participants.forEach(function(name) {

                if (name && name.trim() !== "") {

                    friends.add(name.trim());

                }

            });

        }

    });


    if (friends.size === 0) {

        friendsList.innerHTML = `
            <p class="no-data">
                Add expenses to see your friends.
            </p>
        `;

        return;
    }


    friendsList.innerHTML = "";


    Array.from(friends)
        .sort()
        .forEach(function(name) {

            const card =
                document.createElement("div");

            card.className =
                "friend-card";

            const firstLetter =
                name.charAt(0).toUpperCase();

            card.innerHTML = `

                <div class="friend-avatar">
                    ${firstLetter}
                </div>

                <div>

                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    <p>
                        Trip participant
                    </p>

                </div>

            `;

            friendsList.appendChild(card);

        });
}


// ================= ANALYTICS =================

function updateAnalytics(expenses) {

    if (!expenses) {
        expenses = [];
    }


    const total =
        expenses.reduce(function(sum, expense) {

            return sum +
                (Number(expense.amount) || 0);

        }, 0);


    const categoryTotals = {};


    expenses.forEach(function(expense) {

        const category =
            expense.category || "Other";

        const amount =
            Number(expense.amount) || 0;

        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }

        categoryTotals[category] += amount;

    });


    let highestCategory = "-";

    let highestAmount = 0;


    Object.keys(categoryTotals).forEach(function(category) {

        if (categoryTotals[category] > highestAmount) {

            highestAmount =
                categoryTotals[category];

            highestCategory =
                category;

        }

    });


    if (expenseCountBox) {

        expenseCountBox.textContent =
            expenses.length;

    }


    if (analyticsTotalBox) {

        analyticsTotalBox.textContent =
            "₹" + total.toFixed(2);

    }


    if (analyticsHighestBox) {

        analyticsHighestBox.textContent =
            highestCategory === "-"
                ? "-"
                : highestCategory +
                  " (₹" +
                  highestAmount.toFixed(2) +
                  ")";

    }

}


// ======================================================
// ADD EXPENSE
// ======================================================

if (form) {

    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const description =
                descriptionInput.value.trim();

            const amount =
                Number(amountInput.value);

            const category =
                categoryInput.value;


            const participants =
                participantsInput.value
                    .split(",")
                    .map(function(name) {
                        return name.trim();
                    })
                    .filter(function(name) {
                        return name !== "";
                    });


            const paidBy =
                paidBySelect.value;


            // ================= VALIDATION =================

            if (!description) {

                alert(
                    "Please enter expense description."
                );

                return;
            }


            if (!amount || amount <= 0) {

                alert(
                    "Please enter a valid amount."
                );

                return;
            }


            if (!category) {

                alert(
                    "Please select a category."
                );

                return;
            }


            if (participants.length < 2) {

                alert(
                    "Please enter at least 2 student names."
                );

                return;
            }


            if (!paidBy) {

                alert(
                    "Please select who paid."
                );

                return;
            }


            // ================= SAVE TO MONGODB =================

            try {

                const response =
                    await fetch(
                        "/api/expenses",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                description:
                                    description,

                                amount:
                                    amount,

                                category:
                                    category,

                                participants:
                                    participants,

                                paidBy:
                                    paidBy

                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Failed to save expense"
                    );

                }


                // ================= RESULT =================

                const eachShare =
                    amount / participants.length;


                if (resultBox) {

                    resultBox.innerHTML = `

                        <div class="success-message">

                            <h3>
                                ✅ Expense Added Successfully!
                            </h3>

                            <p>
                                <strong>
                                    ${escapeHTML(description)}
                                </strong>
                                — ₹${amount.toFixed(2)}
                            </p>

                            <p>
                                Paid by:
                                <strong>
                                    ${escapeHTML(paidBy)}
                                </strong>
                            </p>

                            <p>
                                Each person pays:
                                <strong>
                                    ₹${eachShare.toFixed(2)}
                                </strong>
                            </p>

                        </div>

                    `;
                }


                // ================= RESET FORM =================

                form.reset();

                updatePaidByDropdown();


                // ================= REFRESH DATA =================

                await loadExpenses();


                // ================= SHOW HISTORY =================

                showSection("history");


            } catch (error) {

                console.error(
                    "Add expense error:",
                    error
                );


                if (resultBox) {

                    resultBox.innerHTML = `

                        <div class="error-message">

                            ❌ Failed to add expense.

                            <br><br>

                            ${escapeHTML(error.message)}

                        </div>

                    `;

                }

            }

        }
    );

}


// ================= DELETE EXPENSE =================

async function deleteExpense(id) {

    if (
        !confirm(
            "Are you sure you want to delete this expense?"
        )
    ) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/expenses/" + id,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to delete expense"
            );

        }


        await loadExpenses();


    } catch (error) {

        console.error(
            "Delete expense error:",
            error
        );


        alert(
            "Failed to delete expense: " +
            error.message
        );

    }

}


window.deleteExpense =
    deleteExpense;


// ================= PARTICIPANTS INPUT =================

if (participantsInput) {

    participantsInput.addEventListener(
        "input",
        updatePaidByDropdown
    );

}


// ================= ESCAPE HTML =================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ================= START APPLICATION =================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        updatePaidByDropdown();

        loadExpenses();

        showSection("dashboard");

    }
);