// priorityInbox.js

// Define weights for different notification types (Placement > Result > Event)
const TYPE_WEIGHTS = {
  placement: 3,
  result: 2,
  event: 1
};

class Notification {
  constructor(id, type, message, timestamp) {
    this.id = id;
    this.type = type.toLowerCase();
    this.message = message;
    // Parse the timestamp string ("YYYY-MM-DD HH:mm:ss") to milliseconds for comparison
    // Replacing space with 'T' to ensure consistent parsing across environments
    const isoString = timestamp.replace(' ', 'T'); 
    this.timestamp = new Date(isoString).getTime();
    this.weight = TYPE_WEIGHTS[this.type] || 0;
  }
}

// A Min-Heap implementation to maintain the top N notifications efficiently.
class TopNNotificationsHeap {
  constructor(n) {
    this.maxSize = n;
    this.heap = [];
  }

  getParentIndex(i) { return Math.floor((i - 1) / 2); }
  getLeftChildIndex(i) { return 2 * i + 1; }
  getRightChildIndex(i) { return 2 * i + 2; }

  swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  compare(a, b) {
    if (a.weight !== b.weight) {
      return a.weight - b.weight; 
    }
    return a.timestamp - b.timestamp; 
  }

  insert(notification) {
    if (this.heap.length < this.maxSize) {
      this.heap.push(notification);
      this.heapifyUp(this.heap.length - 1);
    } else {
      if (this.compare(notification, this.heap[0]) > 0) {
        this.heap[0] = notification;
        this.heapifyDown(0);
      }
    }
  }

  heapifyUp(index) {
    let currentIndex = index;
    while (currentIndex > 0) {
      let parentIndex = this.getParentIndex(currentIndex);
      if (this.compare(this.heap[currentIndex], this.heap[parentIndex]) < 0) {
        this.swap(currentIndex, parentIndex);
        currentIndex = parentIndex;
      } else {
        break;
      }
    }
  }

  heapifyDown(index) {
    let currentIndex = index;
    while (this.getLeftChildIndex(currentIndex) < this.heap.length) {
      let smallestChildIndex = this.getLeftChildIndex(currentIndex);
      let rightChildIndex = this.getRightChildIndex(currentIndex);

      if (rightChildIndex < this.heap.length && this.compare(this.heap[rightChildIndex], this.heap[smallestChildIndex]) < 0) {
        smallestChildIndex = rightChildIndex;
      }

      if (this.compare(this.heap[currentIndex], this.heap[smallestChildIndex]) > 0) {
        this.swap(currentIndex, smallestChildIndex);
        currentIndex = smallestChildIndex;
      } else {
        break;
      }
    }
  }

  getTopNotifications() {
    return [...this.heap].sort((a, b) => this.compare(b, a));
  }
}

// --- Main Application Logic ---
async function fetchNotifications() {
  const url = 'http://4.224.186.213/evaluation-service/notifications';
  
  // Look for a token in the environment since it's a protected route
  const token = process.env.API_TOKEN || '';
  
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`; // Adjust scheme if not Bearer
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: headers
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.notifications || [];
}

async function runPriorityInbox() {
  console.log("--- Initializing Priority Inbox (Top 10) ---");
  const inbox = new TopNNotificationsHeap(10);
  
  try {
    console.log("Fetching notifications from API...");
    const rawNotifications = await fetchNotifications();
    
    console.log(`Successfully fetched ${rawNotifications.length} notifications.`);
    
    // Map API response to our Notification class and insert into heap
    rawNotifications.forEach(n => {
      const notification = new Notification(n.ID, n.Type, n.Message, n.Timestamp);
      inbox.insert(notification);
    });

    displayInbox(inbox);

  } catch (error) {
    console.error("\n[!] Failed to fetch notifications from API:", error.message);
    if (error.message.includes('401') || error.message.includes('403')) {
      console.log("-> The API is a protected route. Make sure to set the API_TOKEN environment variable.");
      console.log("-> Example: API_TOKEN='your_actual_token' node priorityInbox.js\n");
    }
    
    console.log("--- Falling back to sample JSON data for demonstration purposes ---\n");
    fallbackDemo(inbox);
  }
}

function displayInbox(inbox) {
    console.log("\n--- Top Priority Notifications Inbox ---");
    const topNotifications = inbox.getTopNotifications();
    topNotifications.forEach((n, index) => {
      // Revert ISO string back to local representation for output display
      const timeString = new Date(n.timestamp).toLocaleString();
      console.log(`${(index + 1).toString().padStart(2, '0')}. [${n.type.toUpperCase().padEnd(9)}] | Time: ${timeString} | ${n.message}`);
    });
}

function fallbackDemo(inbox) {
  const sampleData = [
    { "ID": "ea836726-c25e-4f21-a72f-544a6af8a37f", "Type": "Result", "Message": "project-review", "Timestamp": "2026-04-22 17:50:42" },
    { "ID": "003cb427-8fc6-47f7-bb00-be228f6b0d2c", "Type": "Result", "Message": "external", "Timestamp": "2026-04-22 17:50:30" },
    { "ID": "e5c4ff20-31bf-4d40-8f02-72fda59e8918", "Type": "Result", "Message": "project-review", "Timestamp": "2026-04-22 17:50:18" },
    { "ID": "1cfce5ee-ad37-4894-8946-d707627176a5", "Type": "Event", "Message": "tech-fest", "Timestamp": "2026-04-22 17:50:06" },
    { "ID": "cf2885a6-45ac-4ba0-b548-6e9e9d4c52c8", "Type": "Result", "Message": "project-review", "Timestamp": "2026-04-22 17:49:54" },
    { "ID": "8a7412bd-6065-4d09-8501-a37f11cc848b", "Type": "Placement", "Message": "Advanced Micro Devices Inc. hiring", "Timestamp": "2026-04-22 17:49:42" },
    { "ID": "d146005a-0d86-4a34-9e69-3908a14576bc", "Type": "Result", "Message": "mid-sem", "Timestamp": "2026-04-22 17:51:30" },
    { "ID": "b283218f-ea5a-4b7c-93a9-1f2f248d64b0", "Type": "Placement", "Message": "CSX Corporation hiring", "Timestamp": "2026-04-22 17:51:18" },
    { "ID": "81589ada-0ad3-4f77-9554-f52fb558e09d", "Type": "Event", "Message": "farewell", "Timestamp": "2026-04-22 17:51:06" },
    { "ID": "0005513a-142b-4bbc-8678-eefec65e1ede", "Type": "Result", "Message": "mid-sem", "Timestamp": "2026-04-22 17:50:54" }
  ];

  sampleData.forEach(n => {
    const notification = new Notification(n.ID, n.Type, n.Message, n.Timestamp);
    inbox.insert(notification);
  });

  displayInbox(inbox);
}

runPriorityInbox();
