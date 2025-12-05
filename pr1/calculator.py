import tkinter as tk
from tkinter import messagebox


class CalculatorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Калькулятор")
        self.root.geometry("300x400")
        self.root.resizable(False, False)

        # Переменные
        self.current_input = "0"
        self.stored_value = None
        self.operator = None
        self.reset_on_next_input = False

        # Дисплей
        self.display_var = tk.StringVar()
        self.display_var.set(self.current_input)
        self.display = tk.Entry(
            root,
            textvariable=self.display_var,
            font=("Arial", 16),
            justify="right",
            state="readonly",
            readonlybackground="white"
        )
        self.display.grid(row=0, column=0, columnspan=4, padx=10, pady=10, sticky="ew")

        # Кнопки
        buttons = [
            ("C", 1, 0), ("±", 1, 1), ("%", 1, 2), ("/", 1, 3),
            ("7", 2, 0), ("8", 2, 1), ("9", 2, 2), ("*", 2, 3),
            ("4", 3, 0), ("5", 3, 1), ("6", 3, 2), ("-", 3, 3),
            ("1", 4, 0), ("2", 4, 1), ("3", 4, 2), ("+", 4, 3),
            ("0", 5, 0), (".", 5, 1), ("=", 5, 2, 1, 2),
        ]

        for btn in buttons:
            text = btn[0]
            row = btn[1]
            col = btn[2]
            rowspan = btn[3] if len(btn) > 3 else 1
            colspan = btn[4] if len(btn) > 4 else 1

            button = tk.Button(
                root,
                text=text,
                font=("Arial", 14),
                command=lambda t=text: self.on_button_click(t)
            )
            button.grid(row=row, column=col, rowspan=rowspan, columnspan=colspan, sticky="nsew", padx=2, pady=2)

        # Настройка сетки
        for i in range(4):
            root.columnconfigure(i, weight=1)
        for i in range(6):
            root.rowconfigure(i, weight=1)

    def on_button_click(self, char):
        if char.isdigit():
            self.input_digit(char)
        elif char == ".":
            self.input_decimal()
        elif char in "+-*/":
            self.set_operator(char)
        elif char == "=":
            self.calculate()
        elif char == "C":
            self.clear()
        elif char == "±":
            self.toggle_sign()
        elif char == "%":
            self.percent()

    def input_digit(self, digit):
        if self.reset_on_next_input:
            self.current_input = "0"
            self.reset_on_next_input = False
        if self.current_input == "0":
            self.current_input = digit
        else:
            self.current_input += digit
        self.update_display()

    def input_decimal(self):
        if self.reset_on_next_input:
            self.current_input = "0"
            self.reset_on_next_input = False
        if "." not in self.current_input:
            self.current_input += "."
        self.update_display()

    def set_operator(self, op):
        if self.stored_value is None:
            self.stored_value = float(self.current_input)
        else:
            self.calculate()
        self.operator = op
        self.reset_on_next_input = True

    def calculate(self):
        if self.operator is None or self.stored_value is None:
            return
        try:
            current = float(self.current_input)
            if self.operator == "+":
                result = self.stored_value + current
            elif self.operator == "-":
                result = self.stored_value - current
            elif self.operator == "*":
                result = self.stored_value * current
            elif self.operator == "/":
                if current == 0:
                    messagebox.showerror("Ошибка", "Деление на ноль!")
                    self.clear()
                    return
                result = self.stored_value / current
            else:
                return
            # Округление, чтобы избежать артефактов с плавающей точкой
            if result.is_integer():
                self.current_input = str(int(result))
            else:
                self.current_input = str(round(result, 10))
            self.stored_value = None
            self.operator = None
            self.reset_on_next_input = True
            self.update_display()
        except Exception as e:
            messagebox.showerror("Ошибка", "Некорректная операция")
            self.clear()

    def clear(self):
        self.current_input = "0"
        self.stored_value = None
        self.operator = None
        self.reset_on_next_input = False
        self.update_display()

    def toggle_sign(self):
        if self.current_input != "0":
            if self.current_input.startswith("-"):
                self.current_input = self.current_input[1:]
            else:
                self.current_input = "-" + self.current_input
            self.update_display()

    def percent(self):
        try:
            value = float(self.current_input)
            value /= 100
            if value.is_integer():
                self.current_input = str(int(value))
            else:
                self.current_input = str(value)
            self.update_display()
        except:
            self.current_input = "0"
            self.update_display()

    def update_display(self):
        self.display_var.set(self.current_input)


if __name__ == "__main__":
    root = tk.Tk()
    app = CalculatorApp(root)
    root.mainloop()