export default {
    en: {
      terminal: {
        welcome: "Welcome to MNQ Terminal v1.0.0\nType 'help' for available commands.\n",
        no_such_directory: "Error: directory {path} not found",
        empty_directory: "(empty)",
        readonly_error: "Error: file is read-only",
        missing_operand: "Error: missing operand for {command}",
        no_such_file: "Error: file {file} not found",
        logout: "logout",
        help_content: `
  Available commands:
    cd [directory]    Change directory
    ls [directory]    List directory contents
    pwd               Print working directory
    cat [file]        Display file contents
    nano [file]       Text editor (read-only)
    clear             Clear terminal
    exit              Exit session
    help              Show this message
    locale [en|ru]    Change language
        `.trim(),
        invalid_locale: "Invalid locale. Use: en or ru",
        readonly: "READ ONLY",
        exit: "Exit",
        readfile: "Read File",
        whereis: "Where Is",
        command_not_found: "Command '{command}' not found"
      },
      locale: {
        changed: "Language changed to {lang}"
      }
    },
    ru: {
      terminal: {
        welcome: "Добро пожаловать в MNQ Terminal v1.0.0\nВведите 'help' для просмотра доступных команд.\n",
        readonly: "ТОЛЬКО ЧТЕНИЕ",
        exit: "Выход",
        readfile: "Открыть файл",
        whereis: "Поиск",
        readonly_error: "Ошибка: файл доступен только для чтения",
        missing_operand: "Ошибка: отсутствует операнд",
        no_such_file: "Ошибка: файл {file} не найден",
        no_such_directory: "Ошибка: каталог {path} не найден",
        command_not_found: "Команда '{command}' не найдена",
        empty_directory: "(пусто)",
        logout: "выход",
        permission_denied: "Отказано в доступе",
        help_content: `
  Доступные команды:
    cd [каталог]      Сменить каталог
    ls [каталог]      Показать содержимое каталога
    pwd               Показать текущий путь
    cat [файл]        Показать содержимое файла
    nano [файл]       Текстовый редактор (только чтение)
    clear             Очистить терминал
    exit              Выйти из сессии
    help              Показать это сообщение
    locale [en|ru]    Сменить язык
        `.trim(),
        invalid_locale: "Неверная локаль. Используйте: en или ru"
      },
      locale: {
        changed: "Язык изменен на {lang}"
      }
    }
  };