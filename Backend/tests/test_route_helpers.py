import unittest
from datetime import date

from fastapi import HTTPException

from app.routes.chilli import DEFAULT_IMAGE_URL, normalize_image_url
from app.routes.product import (
    DEFAULT_PRODUCT_IMAGE_EXTENSION,
    PRODUCT_IMAGE_PREFIX,
    normalize_product_image_url,
    parse_restock_date,
)


class ParseRestockDateTests(unittest.TestCase):
    def test_returns_none_for_empty_values(self):
        self.assertIsNone(parse_restock_date(None))
        self.assertIsNone(parse_restock_date(""))
        self.assertIsNone(parse_restock_date("   "))

    def test_accepts_multiple_supported_formats(self):
        self.assertEqual(parse_restock_date("2026-04-11"), date(2026, 4, 11))
        self.assertEqual(parse_restock_date("11/04/2026"), date(2026, 4, 11))
        self.assertEqual(parse_restock_date("23-04-2026"), date(2026, 4, 23))
        self.assertEqual(parse_restock_date("04/23/2026"), date(2026, 4, 23))

    def test_raises_for_invalid_dates(self):
        with self.assertRaises(HTTPException) as context:
            parse_restock_date("not-a-date")

        self.assertEqual(context.exception.status_code, 400)


class ProductImageNormalizationTests(unittest.TestCase):
    def test_uses_existing_jpg_file_when_present(self):
        self.assertEqual(
            normalize_product_image_url("hot_sour"),
            f"{PRODUCT_IMAGE_PREFIX}hot_sour.jpg",
        )

    def test_falls_back_to_default_extension_for_missing_file(self):
        self.assertEqual(
            normalize_product_image_url("new_product"),
            f"{PRODUCT_IMAGE_PREFIX}new_product{DEFAULT_PRODUCT_IMAGE_EXTENSION}",
        )


class ProductHttpsImageNormalizationTests(unittest.TestCase):
    def test_https_url_passes_through_unchanged(self):
        url = "https://proj.supabase.co/storage/v1/object/sign/product-images/sauce.jpg?token=abc"
        self.assertEqual(normalize_product_image_url(url), url)

    def test_signed_supabase_url_passes_through_unchanged(self):
        url = "https://example.com/product-images/my-product.png"
        self.assertEqual(normalize_product_image_url(url), url)

    def test_empty_string_raises_http_exception(self):
        with self.assertRaises(HTTPException) as context:
            normalize_product_image_url("")
        self.assertEqual(context.exception.status_code, 400)


class ChilliImageNormalizationTests(unittest.TestCase):
    def test_returns_default_image_for_blank_value(self):
        self.assertEqual(normalize_image_url("   "), DEFAULT_IMAGE_URL)

    def test_keeps_absolute_and_relative_urls(self):
        self.assertEqual(
            normalize_image_url("https://example.com/chilli.jpg"),
            "https://example.com/chilli.jpg",
        )
        self.assertEqual(
            normalize_image_url("../chilli_images/naga.jpg"),
            "../chilli_images/naga.jpg",
        )

    def test_prefixes_plain_image_names(self):
        self.assertEqual(
            normalize_image_url("naga.jpg"),
            "../chilli_images/naga.jpg",
        )


if __name__ == "__main__":
    unittest.main()
