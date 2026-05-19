from services.gemini_service import generate_quiz_questions

sample_text = """
Python is a programming language.
CPU stands for Central Processing Unit.
"""

result = generate_quiz_questions(sample_text, "Medium")

print(result)