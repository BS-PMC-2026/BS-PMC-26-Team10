import unittest

from pydantic import ValidationError

from app.models import Product


class ProductModelTests(unittest.TestCase):
    def _valid(self, **overrides):
        data = {
            "name": "Hot Sour Sauce",
            "description": "Spicy chilli sauce with sour flavor",
            "quantity": 10,
            "restock_date": "2026-04-20",
            "price": 15.0,
            "image_url": "https://example.com/hot_sour.jpg",
        }
        data.update(overrides)
        return data

    def test_valid_product_creates_successfully(self):
        product = Product(**self._valid())
        self.assertEqual(product.name, "Hot Sour Sauce")
        self.assertEqual(product.price, 15.0)
        self.assertEqual(product.quantity, 10)

    def test_ingredients_defaults_to_empty_string(self):
        product = Product(**self._valid())
        self.assertEqual(product.ingredients, "")

    def test_ingredients_image_url_defaults_to_empty_string(self):
        product = Product(**self._valid())
        self.assertEqual(product.ingredients_image_url, "")

    def test_ingredients_can_be_set(self):
        product = Product(**self._valid(ingredients="Chili peppers, vinegar, salt, garlic"))
        self.assertEqual(product.ingredients, "Chili peppers, vinegar, salt, garlic")

    def test_ingredients_image_url_can_be_set(self):
        url = "https://example.com/ingredients.jpg"
        product = Product(**self._valid(ingredients_image_url=url))
        self.assertEqual(product.ingredients_image_url, url)

    def test_name_is_required(self):
        data = self._valid()
        del data["name"]
        with self.assertRaises(ValidationError):
            Product(**data)

    def test_description_is_required(self):
        data = self._valid()
        del data["description"]
        with self.assertRaises(ValidationError):
            Product(**data)

    def test_price_rejects_non_numeric_string(self):
        with self.assertRaises(ValidationError):
            Product(**self._valid(price="expensive"))

    def test_quantity_rejects_non_numeric_string(self):
        with self.assertRaises(ValidationError):
            Product(**self._valid(quantity="many"))


if __name__ == "__main__":
    unittest.main()
