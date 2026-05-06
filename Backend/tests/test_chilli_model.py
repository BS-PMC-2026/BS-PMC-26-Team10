import unittest

from pydantic import ValidationError

from app.models import Chilli


class ChilliModelTests(unittest.TestCase):
    def _valid(self, **overrides):
        data = {
            "name": "Habanero",
            "description": "A hot pepper",
            "origin": "Mexico",
            "color": "Orange",
            "shuMin": 100000,
            "shuMax": 350000,
            "season": "Summer",
        }
        data.update(overrides)
        return data

    def test_valid_chilli_creates_successfully(self):
        chilli = Chilli(**self._valid())
        self.assertEqual(chilli.name, "Habanero")
        self.assertEqual(chilli.shuMin, 100000)
        self.assertEqual(chilli.shuMax, 350000)

    def test_shu_min_accepts_integer(self):
        chilli = Chilli(**self._valid(shuMin=50000))
        self.assertEqual(chilli.shuMin, 50000)

    def test_shu_max_accepts_integer(self):
        chilli = Chilli(**self._valid(shuMax=500000))
        self.assertEqual(chilli.shuMax, 500000)

    def test_shu_min_rejects_non_numeric_string(self):
        with self.assertRaises(ValidationError):
            Chilli(**self._valid(shuMin="hot"))

    def test_shu_max_rejects_non_numeric_string(self):
        with self.assertRaises(ValidationError):
            Chilli(**self._valid(shuMax="unknown"))

    def test_full_description_defaults_to_empty_string(self):
        chilli = Chilli(**self._valid())
        self.assertEqual(chilli.full_description, "")

    def test_full_description_can_be_set(self):
        chilli = Chilli(**self._valid(full_description="A very detailed description of this pepper."))
        self.assertEqual(chilli.full_description, "A very detailed description of this pepper.")

    def test_image_url_defaults_to_empty_string(self):
        chilli = Chilli(**self._valid())
        self.assertEqual(chilli.image_url, "")

    def test_image_url_can_be_set(self):
        url = "https://example.com/habanero.jpg"
        chilli = Chilli(**self._valid(image_url=url))
        self.assertEqual(chilli.image_url, url)

    def test_name_is_required(self):
        data = self._valid()
        del data["name"]
        with self.assertRaises(ValidationError):
            Chilli(**data)

    def test_description_is_required(self):
        data = self._valid()
        del data["description"]
        with self.assertRaises(ValidationError):
            Chilli(**data)


if __name__ == "__main__":
    unittest.main()
