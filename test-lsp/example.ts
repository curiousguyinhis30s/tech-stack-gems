interface User {
  id: number;
  name: string;
  email: string;
}

function createUser(name: string, email: string): User {
  return {
    id: Math.random(),
    name,
    email
  };
}

function greetUser(user: User): string {
  return `Hello, ${user.name}!`;
}

const testUser = createUser("John", "john@example.com");
console.log(greetUser(testUser));
