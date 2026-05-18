# Stage 1

## Approach

To efficiently maintain the top `n` most important unread notifications out of a potentially massive and continuously growing volume, a **Min-Heap (Priority Queue)** data structure is the optimal approach.

### Notification Fetching

As per the requirements, notifications are retrieved dynamically via a protected REST API endpoint (`GET http://4.224.186.213/evaluation-service/notifications`). 
- The application uses native Node.js `fetch` to retrieve the JSON response from this endpoint.
- Because it is a protected route, the code looks for a token to be provided via the `API_TOKEN` environment variable. If it isn't provided (or if the API returns 401 Unauthorized), the system safely falls back to processing a demonstration set of sample JSON data to showcase the priority logic.

### Why a Min-Heap?

1. **Efficiency for Top N Elements**: We only need to maintain the top `10` notifications at any given time. Instead of sorting an entire array of notifications every time a new one arrives (which would be `O(M log M)` where M is the total number of notifications), we only maintain a heap of fixed size `n = 10`.
2. **Time Complexity**: 
   - Inserting into a heap of size `n` takes `O(log n)` time. 
   - Since `n` is a small constant (10), insertion is effectively `O(1)`. 
   - Processing `M` incoming notifications takes `O(M log n)` time, which is vastly superior to sorting the whole array.
3. **Space Complexity**: The memory footprint is strictly limited to `O(n)` (just 10 items), rather than growing linearly with the total number of notifications.

### Priority Logic

Priority is determined by a combination of **Weight** and **Recency**:
1. **Weight**: We assigned fixed integer values to the types (`placement` = 3, `result` = 2, `event` = 1) because Placements have the highest priority, followed by Results, and then Events.
2. **Recency**: We utilize the `Timestamp` provided by the API ("YYYY-MM-DD HH:mm:ss"). 

When comparing two notifications:
- The system first checks their weights. The notification with the higher weight is given higher priority.
- If the weights are identical (e.g., two placement notifications), the system compares their timestamps. The one with the larger timestamp (more recent) is given higher priority.

### Implementation Details
- We use a **Min-Heap** to store the top `n` notifications. 
- The root of this Min-Heap always represents the *lowest* priority notification currently residing in the top `10`.
- When a new notification arrives:
  - If the heap has fewer than `n` elements, we simply insert it and heapify up.
  - If the heap is full (size `n`), we compare the new notification's priority against the root of the heap.
  - If the new notification has a *higher* priority than the root, we replace the root with the new notification and heapify down to restore the Min-Heap property. Otherwise, we ignore it.
- To display the results, we extract all elements from the heap and sort them in descending order of priority for the final output.
