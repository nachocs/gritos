# PropTypes Style Guide

This guide explains how to use PropTypes for runtime type checking in the Gritos React app.

## Overview

PropTypes provides runtime type checking for React component props. While not as comprehensive as TypeScript, it helps catch bugs during development and serves as documentation.

## Installation

PropTypes is already installed in the project:

```bash
npm install prop-types
```

## Basic Usage

### Import PropTypes

```javascript
import PropTypes from "prop-types";
```

### Define PropTypes for a Component

```javascript
const MyComponent = ({ name, age, isActive }) => (
  <div>
    <h1>{name}</h1>
    <p>Age: {age}</p>
    <p>Status: {isActive ? "Active" : "Inactive"}</p>
  </div>
);

MyComponent.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
};

export default MyComponent;
```

## PropTypes Validators

### Primitives

```javascript
PropTypes.string;
PropTypes.number;
PropTypes.bool;
PropTypes.symbol;
PropTypes.func;
```

### Collections

```javascript
PropTypes.array;
PropTypes.object;
PropTypes.arrayOf(PropTypes.string); // Array of strings
PropTypes.objectOf(PropTypes.number); // Object with number values
PropTypes.shape({
  // Object with specific shape
  id: PropTypes.number,
  name: PropTypes.string,
});
```

### Render Types

```javascript
PropTypes.element; // React element
PropTypes.elementType; // React component
PropTypes.node; // Renderable node (string, number, element, etc)
```

### Special

```javascript
PropTypes.any; // Any type (avoid using)
PropTypes.oneOf(["a", "b", "c"]); // Limited set of values
PropTypes.oneOfType([PropTypes.string, PropTypes.number]);
PropTypes.instanceOf(ClassName);
```

## Making Props Required

Add `.isRequired` to any PropType:

```javascript
PropTypes.string.isRequired;
PropTypes.number.isRequired;
PropTypes.array.isRequired;
```

## Default Values

Use `defaultProps` for default values:

```javascript
const UserCard = ({ name, role, isAdmin }) => (
  <div>
    {name} - {role}
  </div>
);

UserCard.propTypes = {
  name: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool,
};

UserCard.defaultProps = {
  isAdmin: false,
};
```

## Complex Examples

### Shape Validation

```javascript
const UserProfile = ({ user }) => (
  <div>
    <h1>{user.name}</h1>
    <p>{user.email}</p>
  </div>
);

UserProfile.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    age: PropTypes.number,
    phone: PropTypes.string,
  }).isRequired,
};
```

### Array of Objects

```javascript
const UserList = ({ users }) => (
  <ul>
    {users.map((user) => (
      <li key={user.id}>{user.name}</li>
    ))}
  </ul>
);

UserList.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string,
    }),
  ).isRequired,
};
```

### Callback Functions

```javascript
const Button = ({ label, onClick }) => (
  <button onClick={onClick}>{label}</button>
);

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};
```

### Conditional Validation

```javascript
const Modal = ({ title, showFooter, footerContent }) => (
  <div>
    <h2>{title}</h2>
    {showFooter && <footer>{footerContent}</footer>}
  </div>
);

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  showFooter: PropTypes.bool,
  footerContent: (props, propName, componentName) => {
    if (props.showFooter && !props[propName]) {
      return new Error(
        `'${propName}' is required when 'showFooter' is true in ${componentName}`,
      );
    }
    return null;
  },
};
```

## Custom Validators

Create custom validators for special validation logic:

```javascript
const validateEmail = (props, propName, componentName) => {
  const value = props[propName];
  if (value === null || value === undefined) {
    return null; // not required
  }
  if (!String(value).match(/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/)) {
    return new Error(
      `Invalid email format for prop '${propName}' of component '${componentName}'`,
    );
  }
  return null;
};

const Contact = ({ email }) => <p>{email}</p>;

Contact.propTypes = {
  email: validateEmail,
};
```

## Best Practices

### 1. Define PropTypes for All Components with Props

```javascript
// ✅ Good
const Greeting = ({ name, age }) => <p>Hello, {name}!</p>;

Greeting.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
};

// ❌ Bad - Missing PropTypes
const Greeting = ({ name, age }) => <p>Hello, {name}!</p>;
```

### 2. Use Specific Types

```javascript
// ✅ Good - Specific types
Button.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

// ❌ Bad - Too generic
Button.propTypes = {
  text: PropTypes.any,
  onClick: PropTypes.any,
};
```

### 3. Document with Shapes

```javascript
// ✅ Good - Clear structure
UserCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
  }).isRequired,
};

// ❌ Bad - Unclear structure
UserCard.propTypes = {
  user: PropTypes.object.isRequired,
};
```

### 4. Validate Arrays Properly

```javascript
// ✅ Good - Array of specific shape
TodoList.propTypes = {
  todos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      completed: PropTypes.bool.isRequired,
    }),
  ).isRequired,
};

// ❌ Bad - Generic array
TodoList.propTypes = {
  todos: PropTypes.array.isRequired,
};
```

### 5. Use oneOf for Enums

```javascript
// ✅ Good - Limited set of values
Button.propTypes = {
  size: PropTypes.oneOf(["small", "medium", "large"]),
  variant: PropTypes.oneOf(["primary", "secondary", "danger"]),
};

// ❌ Bad - Any string accepted
Button.propTypes = {
  size: PropTypes.string,
  variant: PropTypes.string,
};
```

## Common Patterns in Gritos

### Context Consumers

```javascript
const LoginStatus = () => {
  const { user, login, logout } = useUser();
  // Component code
};

// No PropTypes needed for context consumers (no external props)
```

### Modal Components

```javascript
const EditFormModal = ({ editForm }) => (
  // Component code
);

EditFormModal.propTypes = {
  editForm: PropTypes.shape({
    msg: PropTypes.object,
    isHead: PropTypes.bool,
    collection: PropTypes.shape({
      id: PropTypes.string,
    }),
  }),
};

EditFormModal.defaultProps = {
  editForm: null,
};
```

### Page Components

```javascript
const ForoPage = () => {
  // Page components typically don't have props
  // (they use React Router params and context)
};

// No PropTypes needed
```

### List Item Components

```javascript
const MessageItem = ({ message, currentForo }) => (
  // Component code
);

MessageItem.propTypes = {
  message: PropTypes.shape({
    ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    INDICE: PropTypes.string,
    COMENTARIOS: PropTypes.string,
    alias_principal: PropTypes.string,
  }).isRequired,
  currentForo: PropTypes.string,
};

MessageItem.defaultProps = {
  currentForo: 'foroscomun',
};
```

## Debugging PropTypes Warnings

When you see PropTypes warnings in the console:

```
Warning: Failed prop type: Invalid prop `name` of type `number` supplied to `MyComponent`, expected `string`.
```

This means:

- A component received a prop of the wrong type
- Check where the component is being used
- Pass the correct type from the parent component

Example fix:

```javascript
// ❌ Wrong - passing number instead of string
<MyComponent name={123} />

// ✅ Correct - passing string
<MyComponent name="John" />
```

## Transition to TypeScript

PropTypes are a good first step, but consider migrating to TypeScript for stronger type safety:

```typescript
// TypeScript interface - better than PropTypes
interface User {
  id: number;
  name: string;
  email: string;
}

interface UserProfileProps {
  user: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => (
  <div>
    <h1>{user.name}</h1>
    <p>{user.email}</p>
  </div>
);
```

## Resources

- [PropTypes Documentation](https://reactjs.org/docs/typechecking-with-proptypes.html)
- [PropTypes GitHub](https://github.com/facebook/prop-types)
- [TypeScript vs PropTypes](https://www.smashingmagazine.com/2021/01/typescript-javascript-migration-guide/)
