// Get the form and the table body
const form = document.getElementById("orderForm");
const ordersTable = document.querySelector("#ordersTable tbody");

// Load any saved orders from localStorage
let orders = JSON.parse(localStorage.getItem("orders") || "[]");

// Function to display all orders on the page
function renderOrders() {
  ordersTable.innerHTML = ""; // clear old data
  orders.forEach((order) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${order.username}</td>
      <td>${order.service}</td>
      <td>${order.quantity}</td>
      <td>${order.status}</td>
    `;
    ordersTable.appendChild(row);
  });

  // Update summary cards
  document.getElementById("ordersCount").textContent = orders.length;
  document.getElementById("completedCount").textContent = orders.filter(o => o.status === "Completed ✅").length;
  document.getElementById("pendingCount").textContent = orders.filter(o => o.status === "Pending ⏳").length;
}

// Handle new order submission
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const quantity = document.getElementById("quantity").value.trim();
  const service = document.getElementById("service").value;

  if (!username || !quantity) return alert("Please fill in all fields");

  const newOrder = {
    username,
    quantity,
    service,
    status: "Pending ⏳"
  };

  orders.push(newOrder);
  localStorage.setItem("orders", JSON.stringify(orders)); // save permanently
  renderOrders();
  form.reset();
});

// Display existing orders when page loads
renderOrders();