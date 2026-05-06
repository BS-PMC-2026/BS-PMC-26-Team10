import unittest

from app.db2 import _extract_storage_path, _resolve_upload_filename


class ExtractStoragePathTests(unittest.TestCase):
    def test_extracts_path_from_signed_url(self):
        url = "https://proj.supabase.co/storage/v1/object/sign/chilli-images/habanero.jpg?token=abc"
        self.assertEqual(_extract_storage_path(url, "chilli-images"), "habanero.jpg")

    def test_extracts_path_from_public_url(self):
        url = "https://proj.supabase.co/storage/v1/object/public/product-images/sauce.jpg"
        self.assertEqual(_extract_storage_path(url, "product-images"), "sauce.jpg")

    def test_decodes_url_encoded_filename(self):
        url = "https://proj.supabase.co/storage/v1/object/sign/chilli-images/hot%20pepper.jpg?token=abc"
        self.assertEqual(_extract_storage_path(url, "chilli-images"), "hot pepper.jpg")

    def test_returns_none_for_wrong_bucket(self):
        url = "https://proj.supabase.co/storage/v1/object/sign/other-bucket/file.jpg?token=abc"
        self.assertIsNone(_extract_storage_path(url, "chilli-images"))

    def test_returns_none_for_non_storage_url(self):
        url = "https://example.com/some/image.jpg"
        self.assertIsNone(_extract_storage_path(url, "chilli-images"))

    def test_works_for_product_images_bucket(self):
        url = "https://proj.supabase.co/storage/v1/object/sign/product-images/my-sauce.png?token=xyz"
        self.assertEqual(_extract_storage_path(url, "product-images"), "my-sauce.png")

    def test_strips_query_string_from_signed_url(self):
        url = "https://proj.supabase.co/storage/v1/object/sign/chilli-images/pepper.jpg?token=very.long.token"
        self.assertEqual(_extract_storage_path(url, "chilli-images"), "pepper.jpg")


class ResolveFilenameTests(unittest.TestCase):
    def test_custom_name_with_extension_used_as_is(self):
        self.assertEqual(_resolve_upload_filename("original.jpg", "jpg", "custom.jpg"), "custom.jpg")

    def test_custom_name_without_extension_gets_ext_appended(self):
        self.assertEqual(_resolve_upload_filename("original.jpg", "jpg", "custom"), "custom.jpg")

    def test_custom_name_preserves_different_extension(self):
        self.assertEqual(_resolve_upload_filename("original.jpg", "jpg", "photo.png"), "photo.png")

    def test_no_custom_name_uses_original_filename(self):
        self.assertEqual(_resolve_upload_filename("pepper.jpg", "jpg", None), "pepper.jpg")

    def test_empty_custom_name_uses_original_filename(self):
        self.assertEqual(_resolve_upload_filename("pepper.jpg", "jpg", ""), "pepper.jpg")

    def test_whitespace_custom_name_uses_original_filename(self):
        self.assertEqual(_resolve_upload_filename("pepper.jpg", "jpg", "   "), "pepper.jpg")

    def test_custom_name_is_trimmed(self):
        self.assertEqual(_resolve_upload_filename("pepper.jpg", "jpg", "  myname  "), "myname.jpg")

    def test_empty_original_and_no_custom_generates_name_with_ext(self):
        result = _resolve_upload_filename("", "png", None)
        self.assertTrue(result.endswith(".png"))
        self.assertGreater(len(result), 4)


if __name__ == "__main__":
    unittest.main()
