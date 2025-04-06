/**
 * Example 2: Testing Token-Based Similarity
 * 
 * This example tests the plugin's ability to detect similar properties/methods
 * based on token analysis and camelCase/snake_case decomposition.
 */

class APIClient {
  fetchUserData() {
    return { name: 'John' };
  }
  
  getUserProfile() {
    return { profile: 'default' };
  }
  
  sendUserMessage(message: string) {
    console.log(`Sending: ${message}`);
  }
  
  uploadFile(file: string) {
    console.log(`Uploading: ${file}`);
  }
}

const client = new APIClient();

// Correct usage
client.fetchUserData();
client.getUserProfile();
client.sendUserMessage("Hello");
client.uploadFile("document.txt");

// Token similarity errors - word swap
client.userData(); // Should suggest "fetchUserData"
client.userProfile(); // Should suggest "getUserProfile"
client.userMessage("test"); // Should suggest "sendUserMessage"
client.fileUpload("test.jpg"); // Should suggest "uploadFile"

// Token similarity errors - incorrect prefix/suffix
client.getUserData(); // Should suggest "fetchUserData" or "getUserProfile"
client.fetchUserProfile(); // Should suggest "fetchUserData" or "getUserProfile"
client.sendUserProfile(); // Should suggest "sendUserMessage" or "getUserProfile" 