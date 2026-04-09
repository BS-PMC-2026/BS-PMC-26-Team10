ALTER TABLE chilli
ADD COLUMN IF NOT EXISTS full_description TEXT;

UPDATE chilli
SET full_description = 'Aji Fantasy is a mild Capsicum baccatum pepper originating from Peru, known for its citrusy sweetness and low heat level. It is commonly used fresh in salads and light dishes.'
WHERE name = 'Aji Fantasy';

UPDATE chilli
SET full_description = 'Bhut Jolokia Peach is one of the hottest peppers in the world, discovered in India. It is mainly used in extreme hot sauces and spicy dishes.'
WHERE name = 'Bhut Jolokia Peach';

UPDATE chilli
SET full_description = 'Bishop''s Crown is a unique shaped pepper from South America with mild heat and sweet flavor, ideal for stuffing and decoration.'
WHERE name LIKE 'Bishop%';

UPDATE chilli
SET full_description = 'Cherry Bomb Orange is a Hungarian pepper with thick flesh and mild heat, commonly used in pickling and stuffing.'
WHERE name = 'Cherry Bomb Orange';

UPDATE chilli
SET full_description = 'Datil pepper is grown in Florida for over 200 years, combining strong heat with a noticeable sweetness.'
WHERE name = 'Datil';

UPDATE chilli
SET full_description = 'Devil''s Tongue is a habanero-type pepper with high heat and fruity citrus flavor, used in spicy sauces.'
WHERE name LIKE 'Devil%';

UPDATE chilli
SET full_description = 'Jamaican Mushroom pepper is a Caribbean variety with a fruity flavor and moderate heat, widely used in local cuisine.'
WHERE name = 'Jamaican Mushroom';

UPDATE chilli
SET full_description = 'Long Horn is a cayenne-type pepper used dried or fresh, common in Asian cuisine and spice production.'
WHERE name = 'Long Horn';

UPDATE chilli
SET full_description = 'Naga pepper is among the hottest peppers globally, originating from India and Bangladesh, used in extreme spicy dishes.'
WHERE name = 'Naga';

UPDATE chilli
SET full_description = 'Wiri Wiri is a small but very hot pepper from Guyana, known for its fruity flavor and strong aroma.'
WHERE name = 'Wiri Wiri';