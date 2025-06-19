-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 05, 2025 at 02:10 PM
-- Server version: 10.6.21-MariaDB-cll-lve
-- PHP Version: 8.3.20

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `crystal_orders`
--

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_id` varchar(50) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `payment_status` varchar(50) NOT NULL DEFAULT 'pending',
  `amount` decimal(10,2) NOT NULL,
  `shipping_amount` decimal(10,2) NOT NULL,
  `shipping_method` varchar(100) NOT NULL,
  `shipping_address` text DEFAULT NULL,
  `order_items` text NOT NULL,
  `order_status` varchar(50) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_id`, `customer_name`, `customer_email`, `customer_phone`, `payment_id`, `payment_status`, `amount`, `shipping_amount`, `shipping_method`, `shipping_address`, `order_items`, `order_status`, `created_at`, `updated_at`) VALUES
(1, 'ORD-1747979127397-d3qsqt5l0', NULL, NULL, NULL, NULL, 'pending', 414.00, 5.99, 'Standard Shipping', NULL, '{\"order_number\":\"ORD-1747979127397-d3qsqt5l0\",\"cart_items\":[{\"productId\":2,\"name\":\"3D Crystal Rectangle Tall\",\"price\":414,\"quantity\":1,\"options\":{\"size\":\"largemantel\",\"background\":\"3d\",\"lightBase\":\"premium\",\"giftStand\":\"none\",\"customText\":{\"line1\":\"\",\"line2\":\"\"}}}],\"subtotal\":414,\"shipping_cost\":5.99,\"shipping_method\":\"Standard Shipping\",\"tax_amount\":0,\"total\":419.99,\"created_at\":\"2025-05-23 05:45:29\"}', 'payment_pending', '2025-05-23 05:45:29', '2025-05-23 05:45:29'),
(2, 'ORD-1747979249479-87gftnf7v', NULL, NULL, NULL, NULL, 'pending', 414.00, 5.99, 'Standard Shipping', NULL, '{\"order_number\":\"ORD-1747979249479-87gftnf7v\",\"cart_items\":[{\"productId\":2,\"name\":\"3D Crystal Rectangle Tall\",\"price\":414,\"quantity\":1,\"options\":{\"size\":\"largemantel\",\"background\":\"3d\",\"lightBase\":\"premium\",\"giftStand\":\"none\",\"customText\":{\"line1\":\"\",\"line2\":\"\"}}}],\"subtotal\":414,\"shipping_cost\":5.99,\"shipping_method\":\"Standard Shipping\",\"tax_amount\":0,\"total\":419.99,\"created_at\":\"2025-05-23 05:47:31\"}', 'payment_pending', '2025-05-23 05:47:31', '2025-05-23 05:47:31'),
(3, 'ORD-1747980308002-1xzl8r28a', NULL, NULL, NULL, NULL, 'pending', 154.00, 5.99, 'Standard Shipping', NULL, '{\"order_number\":\"ORD-1747980308002-1xzl8r28a\",\"cart_items\":[{\"productId\":2,\"name\":\"3D Crystal Rectangle Tall\",\"price\":154,\"quantity\":1,\"options\":{\"size\":\"xlarge\",\"background\":\"rm\",\"lightBase\":\"standard\",\"giftStand\":\"none\",\"customText\":{\"line1\":\"\",\"line2\":\"\"}}}],\"subtotal\":154,\"shipping_cost\":5.99,\"shipping_method\":\"Standard Shipping\",\"tax_amount\":0,\"total\":159.99,\"created_at\":\"2025-05-23 06:05:10\"}', 'payment_pending', '2025-05-23 06:05:10', '2025-05-23 06:05:10'),
(4, 'ORD-1747980479172-4efau8idx', NULL, NULL, NULL, NULL, 'pending', 154.00, 5.99, 'Standard Shipping', NULL, '{\"order_number\":\"ORD-1747980479172-4efau8idx\",\"cart_items\":[{\"productId\":2,\"name\":\"3D Crystal Rectangle Tall\",\"price\":154,\"quantity\":1,\"options\":{\"size\":\"xlarge\",\"background\":\"rm\",\"lightBase\":\"standard\",\"giftStand\":\"none\",\"customText\":{\"line1\":\"\",\"line2\":\"\"}}}],\"subtotal\":154,\"shipping_cost\":5.99,\"shipping_method\":\"Standard Shipping\",\"tax_amount\":0,\"total\":159.99,\"created_at\":\"2025-05-23 06:08:00\"}', 'payment_pending', '2025-05-23 06:08:00', '2025-05-23 06:08:00'),
(5, 'ORD-1747981102067-6d9jui0rp', NULL, NULL, NULL, NULL, 'pending', 184.00, 5.99, 'Standard Shipping', NULL, '{\"order_number\":\"ORD-1747981102067-6d9jui0rp\",\"cart_items\":[{\"productId\":2,\"name\":\"3D Crystal Rectangle Tall\",\"price\":184,\"quantity\":1,\"options\":{\"size\":\"xlarge\",\"background\":\"3d\",\"lightBase\":\"premium\",\"giftStand\":\"none\",\"customText\":{\"line1\":\"\",\"line2\":\"\"}}}],\"subtotal\":184,\"shipping_cost\":5.99,\"shipping_method\":\"Standard Shipping\",\"tax_amount\":0,\"total\":189.99,\"created_at\":\"2025-05-23 06:18:23\"}', 'payment_pending', '2025-05-23 06:18:23', '2025-05-23 06:18:23'),
(6, 'ORD-1747981263344-u1o3u0yau', NULL, NULL, NULL, NULL, 'pending', 414.00, 5.99, 'Standard Shipping', NULL, '{\"order_number\":\"ORD-1747981263344-u1o3u0yau\",\"cart_items\":[{\"productId\":2,\"name\":\"3D Crystal Rectangle Tall\",\"price\":414,\"quantity\":1,\"options\":{\"size\":\"largemantel\",\"background\":\"3d\",\"lightBase\":\"premium\",\"giftStand\":\"none\",\"customText\":{\"line1\":\"\",\"line2\":\"\"}}}],\"subtotal\":414,\"shipping_cost\":5.99,\"shipping_method\":\"Standard Shipping\",\"tax_amount\":0,\"total\":419.99,\"created_at\":\"2025-05-23 06:21:05\"}', 'payment_pending', '2025-05-23 06:21:05', '2025-05-23 06:21:05');

-- --------------------------------------------------------

--
-- Table structure for table `order_images`
--

CREATE TABLE `order_images` (
  `id` int(11) NOT NULL,
  `order_id` varchar(50) NOT NULL,
  `cart_item_id` varchar(100) NOT NULL,
  `image_type` enum('raw','preview','masked') NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_images`
--

INSERT INTO `order_images` (`id`, `order_id`, `cart_item_id`, `image_type`, `file_path`, `original_filename`, `file_size`, `mime_type`, `created_at`) VALUES
(1, 'ORD-1747979127397-d3qsqt5l0', '1747979123040-nyzy1jum4', 'raw', 'uploads/orders/ORD-1747979127397-d3qsqt5l0/1747979123040-nyzy1jum4_raw_1747979129.jpg', '1747979123040-nyzy1jum4_raw_1747979129.jpg', 130618, 'image/jpeg', '2025-05-23 05:45:29'),
(2, 'ORD-1747979249479-87gftnf7v', '1747979123040-nyzy1jum4', 'raw', 'uploads/orders/ORD-1747979249479-87gftnf7v/1747979123040-nyzy1jum4_raw_1747979251.jpg', '1747979123040-nyzy1jum4_raw_1747979251.jpg', 130618, 'image/jpeg', '2025-05-23 05:47:31'),
(3, 'ORD-1747980308002-1xzl8r28a', '1747980306104-xpg5en7bk', 'raw', 'uploads/orders/ORD-1747980308002-1xzl8r28a/1747980306104-xpg5en7bk_raw_1747980310.jpg', '1747980306104-xpg5en7bk_raw_1747980310.jpg', 63136, 'image/jpeg', '2025-05-23 06:05:10'),
(4, 'ORD-1747980479172-4efau8idx', '1747980306104-xpg5en7bk', 'raw', 'uploads/orders/ORD-1747980479172-4efau8idx/1747980306104-xpg5en7bk_raw_1747980480.jpg', '1747980306104-xpg5en7bk_raw_1747980480.jpg', 63136, 'image/jpeg', '2025-05-23 06:08:00'),
(5, 'ORD-1747981102067-6d9jui0rp', '1747981100236-6xewddnkv', 'raw', 'uploads/orders/ORD-1747981102067-6d9jui0rp/1747981100236-6xewddnkv_raw_1747981103.jpg', '1747981100236-6xewddnkv_raw_1747981103.jpg', 130618, 'image/jpeg', '2025-05-23 06:18:23'),
(6, 'ORD-1747981263344-u1o3u0yau', '1747981261773-dibboamaf', 'raw', 'uploads/orders/ORD-1747981263344-u1o3u0yau/1747981261773-dibboamaf_raw_1747981265.jpg', '1747981261773-dibboamaf_raw_1747981265.jpg', 130618, 'image/jpeg', '2025-05-23 06:21:05');

-- --------------------------------------------------------

--
-- Table structure for table `order_status_history`
--

CREATE TABLE `order_status_history` (
  `id` int(11) NOT NULL,
  `order_id` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_id` (`order_id`),
  ADD KEY `payment_id` (`payment_id`);

--
-- Indexes for table `order_images`
--
ALTER TABLE `order_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `cart_item_id` (`cart_item_id`);

--
-- Indexes for table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `order_images`
--
ALTER TABLE `order_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `order_status_history`
--
ALTER TABLE `order_status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `order_images`
--
ALTER TABLE `order_images`
  ADD CONSTRAINT `order_images_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
