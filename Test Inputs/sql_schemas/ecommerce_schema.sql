-- E-Commerce Database Schema for Testing
-- Database: EcommerceDB
-- Purpose: Test SQL Bridge functionality

CREATE TABLE Customers (
  CustomerID INT PRIMARY KEY,
  FirstName VARCHAR(50) NOT NULL,
  LastName VARCHAR(50) NOT NULL,
  Email VARCHAR(100) UNIQUE NOT NULL,
  Country VARCHAR(50),
  City VARCHAR(50),
  CreatedDate DATE DEFAULT CURRENT_DATE
);

CREATE TABLE Products (
  ProductID INT PRIMARY KEY,
  ProductName VARCHAR(100) NOT NULL,
  Category VARCHAR(50),
  UnitPrice DECIMAL(10,2) NOT NULL,
  StockQuantity INT DEFAULT 0,
  Description TEXT
);

CREATE TABLE Orders (
  OrderID INT PRIMARY KEY,
  CustomerID INT NOT NULL,
  OrderDate DATE NOT NULL,
  TotalAmount DECIMAL(10,2) NOT NULL,
  Status VARCHAR(20) DEFAULT 'Pending',
  ShippingAddress TEXT,
  FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);

CREATE TABLE OrderItems (
  OrderItemID INT PRIMARY KEY,
  OrderID INT NOT NULL,
  ProductID INT NOT NULL,
  Quantity INT NOT NULL,
  UnitPrice DECIMAL(10,2) NOT NULL,
  Subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
  FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- Sample Data Insights:
-- - Total Customers: ~500
-- - Total Products: ~200 across 10 categories
-- - Average Order Value: $150
-- - Top Category: Electronics (40% of sales)
