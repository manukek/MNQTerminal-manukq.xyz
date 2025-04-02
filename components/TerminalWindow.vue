<template>
  <div class="w-[1200px] h-[800px] bg-black/20 text-white border border-white/10 rounded-lg shadow-lg overflow-hidden">
    <div class="flex items-center justify-between bg-black/20 border-b border-white/10 px-4 py-2">
      <div class="flex space-x-2">
        <span class="w-3 h-3 bg-red-500 rounded-full"></span>
        <span class="w-3 h-3 bg-yellow-500 rounded-full"></span>
        <span class="w-3 h-3 bg-green-500 rounded-full"></span>
      </div>
      <p class="text-sm text-gray-300">Terminal - manukq.xyz</p>
    </div>

    <div v-if="!nanoOpen" class="p-4 h-[calc(100%-3rem)] overflow-y-auto font-mono text-sm" ref="terminalOutput">
      <div v-for="(line, index) in output" :key="index" class="whitespace-pre-wrap">
        <span v-if="line?.startsWith('user@manukq.xyz')" class="text-green-400">{{ line }}</span>
        <span v-else v-html="line"></span>
      </div>
      <div class="flex">
        <span class="text-green-400">{{ prompt }}</span>
        <input
          v-model="input"
          @keyup.enter="runCommand"
          @keydown="handleKeydown"
          class="bg-transparent outline-none text-white w-full ml-1"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
        />
      </div>
    </div>

    <div v-else class="h-[calc(100%-3rem)] bg-black/20 text-white font-mono text-sm flex flex-col">
      <div class="bg-white text-black px-2 py-1">
        GNU nano {{ nanoFile }} ({{ currentMessages?.readonly || 'READ ONLY' }})
      </div>
      <div class="flex-1 p-2 overflow-y-auto">
        <textarea
          v-model="nanoContent"
          class="w-full h-full bg-transparent outline-none resize-none"
          @keydown="handleNanoKeydown"
          readonly
          spellcheck="false"
        ></textarea>
      </div>
      <div class="bg-white text-black px-2 py-1">
        ^X {{ currentMessages?.exit || 'Exit' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const useStorage = () => {
  const getItem = (key, defaultValue) => {
    if (process.client) {
      return localStorage.getItem(key) || defaultValue
    }
    return defaultValue
  }

  const setItem = (key, value) => {
    if (process.client) {
      localStorage.setItem(key, value)
    }
  }

  return { getItem, setItem }
  
}

const { getItem, setItem } = useStorage()

const currentMessages = ref({})
const currentLocale = ref('ru')
const input = ref('')
const output = ref([])
const currentPath = ref('/home/user')
const homeDirectory = '/home/user'
const nanoOpen = ref(false)
const nanoFile = ref('')
const nanoContent = ref('')
const terminalOutput = ref(null)
const commandHistory = ref([])
const historyIndex = ref(-1)
const savedCommand = ref('')

const loadMessages = async (locale) => {
  try {
    const messages = await import(`../locales/${locale}.json`)
    currentMessages.value = messages.default
    return true
  } catch (error) {
    console.error('Failed to load messages:', error)
    return false
  }
}

const t = (key, params = {}) => {
  let text = currentMessages.value?.[key] || key
  Object.entries(params).forEach(([key, value]) => {
    text = text.replace(`{${key}}`, value)
  })
  return text
}

const fileSystem = {
  type: 'directory',
  permissions: { read: true },
  color: '#4EAA25',
  contents: {
    'home': {
      type: 'directory',
      permissions: { read: true },
      color: '#4EAA25',
      contents: {
        'user': {
          type: 'directory',
          permissions: { read: true },
          color: '#4EAA25',
          contents: {
            'Projects': {
              type: 'directory',
              permissions: { read: true },
              color: '#4EAA25',
              contents: {
                'Documentation': {
                  type: 'file',
                  permissions: { read: true },
                  color: 'white',
                  content: '# Project Documentation\n\n## Overview\nThis documentation covers all aspects of the project.\n\n## Getting Started\n1. Clone repository\n2. Install dependencies\n3. Run development server'
                }
              }
            },
            'Links': {
              type: 'directory',
              permissions: { read: true },
              color: '#4EAA25',
              contents: {
                'github.txt': {
                  type: 'file',
                  permissions: { read: true },
                  color: 'white',
                  content: 'GitHub: https://github.com/manukek\nWebsite: https://manukq.xyz'
                }
              }
            },
            'DevStack': {
              type: 'directory',
              permissions: { read: true },
              color: '#4EAA25',
              contents: {
                'tech.md': {
                  type: 'file',
                  permissions: { read: true },
                  color: 'white',
                  content: '# Development Stack\n\n- Vue.js\n- Node.js\n- TypeScript\n- Docker\n- Kubernetes'
                }
              }
            }
          }
        }
      }
    }
  }
}

const prompt = computed(() => {
  const displayPath = currentPath.value.replace(homeDirectory, '~')
  return `user@manukq.xyz:${displayPath}$ `
})

function parsePath(path) {
  if (path === '/') return []
  return path.split('/').filter(segment => segment !== '')
}

function getByPath(fs, pathArray, caseInsensitive = true) {
  let current = fs
  let fullPath = pathArray.join('/').toLowerCase()
  const directPaths = {
    'links/github.txt': {
      type: 'file',
      permissions: { read: true },
      color: 'green',
      content: 'https://github.com/manukek'
    }
  }

  if (directPaths[fullPath]) {
    return directPaths[fullPath]
  }

  for (let segment of pathArray) {
    if (current.type !== 'directory') return null
    if (caseInsensitive) {
      const matchingKey = Object.keys(current.contents).find(
        key => key.toLowerCase() === segment.toLowerCase()
      )
      if (!matchingKey) return null
      current = current.contents[matchingKey]
    } else {
      if (!current.contents[segment]) return null
      current = current.contents[segment]
    }
  }
  return current
}

function expandTilde(path) {
  if (path.startsWith('~')) {
    return homeDirectory + path.slice(1)
  }
  return path
}

function resolveRelativePath(currentPath, relativePath) {
  const currentArray = parsePath(currentPath)
  const relativeArray = relativePath.split('/').filter(segment => segment !== '')
  const newArray = [...currentArray]
  
  for (let segment of relativeArray) {
    if (segment === '..') {
      if (newArray.length > 0) newArray.pop()
    } else if (segment !== '.') {
      newArray.push(segment)
    }
  }
  return '/' + newArray.join('/')
}

const runCommand = async () => {
  if (!input.value.trim()) {
    output.value.push(prompt.value)
    input.value = ''
    return
  }

  const command = input.value.trim()
  if (!commandHistory.value.length || commandHistory.value[commandHistory.value.length - 1] !== command) {
    commandHistory.value.push(command)
  }
  historyIndex.value = commandHistory.value.length
  output.value.push(`${prompt.value}${command}`)

  const [cmd, ...args] = command.split(' ')

  switch (cmd.toLowerCase()) {
    case 'cd':
      let target = args[0] || homeDirectory
      target = expandTilde(target)
      if (!args[0]) {
        currentPath.value = homeDirectory
        break
      }
      let newPath
      if (target.startsWith('/')) {
        newPath = target
      } else {
        newPath = resolveRelativePath(currentPath.value, target)
      }
      const pathArray = parsePath(newPath)
      const targetDir = getByPath(fileSystem, pathArray, true)
      if (targetDir && targetDir.type === 'directory') {
        currentPath.value = newPath
      } else {
        output.value.push(t('no_such_directory', { path: args[0] }))
      }
      break

      case 'ls':
        let lsPath = args[0] ? expandTilde(args[0]) : currentPath.value
        if (!lsPath.startsWith('/')) {
          lsPath = resolveRelativePath(currentPath.value, lsPath)
        }
        const lsPathArray = parsePath(lsPath)
        let dir
        
        if (lsPath === '/') {
          dir = fileSystem
        } else {
          dir = getByPath(fileSystem, lsPathArray, true)
        }
        
        if (dir && dir.type === 'directory') {
          const contents = Object.entries(dir.contents).map(([name, item]) => {
            const color = item.type === 'directory' ? '#4EAA25' : 'white'
            return `<span style="color: ${color}">${name}</span>`
          }).join('\n')
          output.value.push(contents || t('empty_directory'))
        } else {
          output.value.push(t('no_such_directory', { path: args[0] || '' }))
        }
        break

    case 'nano':
      if (args[0]) {
        let filePath = expandTilde(args[0])
        if (!filePath.startsWith('/')) {
          if (args[0].includes('/')) {
            filePath = '/' + args[0]
          } else {
            filePath = resolveRelativePath(currentPath.value, filePath)
          }
        }
        const filePathArray = parsePath(filePath)
        const file = getByPath(fileSystem, filePathArray, true)
        if (file && file.type === 'file') {
          nanoFile.value = args[0]
          nanoContent.value = file.content
          nanoOpen.value = true
        } else {
          output.value.push(t('readonly_error', { file: args[0] }))
        }
      } else {
        output.value.push(t('missing_operand', { command: 'nano' }))
      }
      break

    case 'exit':
      if (nanoOpen.value) {
        nanoOpen.value = false
      } else {
        output.value.push(t('logout'))
      }
      break

    case 'pwd':
      output.value.push(currentPath.value)
      break

    case 'cat':
      if (args[0]) {
        let filePath = expandTilde(args[0])
        if (!filePath.startsWith('/')) {
          if (args[0].includes('/')) {
            filePath = '/' + args[0]
          } else {
            filePath = resolveRelativePath(currentPath.value, filePath)
          }
        }
        const filePathArray = parsePath(filePath)
        const file = getByPath(fileSystem, filePathArray, true)
        if (file && file.type === 'file') {
          output.value.push(file.content)
        } else {
          output.value.push(t('no_such_file', { file: args[0] }))
        }
      } else {
        output.value.push(t('missing_operand', { command: 'cat' }))
      }
      break

    case 'clear':
      output.value = []
      break

    case 'help':
      output.value.push(t('help_content'))
      break

    case 'locale':
      if (args[0] && ['en', 'ru'].includes(args[0])) {
        await loadMessages(args[0])
        currentLocale.value = args[0]
        setItem('lang', args[0])
        output.value.push(t('locale_changed', { lang: args[0] }))
      } else {
        output.value.push(t('invalid_locale'))
      }
      break

    default:
      output.value.push(t('command_not_found', { command: cmd }))
  }

  input.value = ''
}

const handleKeydown = (event) => {
  if (event.ctrlKey && event.key === 'c') {
    if (nanoOpen.value) {
      nanoOpen.value = false
      output.value.push('^C')
    } else {
      output.value.push(`${prompt.value}${input.value}`)
      output.value.push('^C')
      input.value = ''
    }
    event.preventDefault()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (commandHistory.value.length > 0) {
      if (historyIndex.value === commandHistory.value.length) {
        savedCommand.value = input.value
      }
      if (historyIndex.value > 0) {
        historyIndex.value--
        input.value = commandHistory.value[historyIndex.value]
      }
    }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (historyIndex.value < commandHistory.value.length - 1) {
      historyIndex.value++
      input.value = commandHistory.value[historyIndex.value]
    } else if (historyIndex.value === commandHistory.value.length - 1) {
      historyIndex.value = commandHistory.value.length
      input.value = savedCommand.value
    }
  }
}

const handleNanoKeydown = (event) => {
  if (event.ctrlKey) {
    if (event.key === 'x') {
      nanoOpen.value = false
      event.preventDefault()
    } else {
      event.preventDefault()
    }
  } else if (!event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
  }
}

onMounted(async () => {
  const savedLocale = getItem('lang', 'ru')
  await loadMessages(savedLocale)
  currentLocale.value = savedLocale
  output.value = [t('welcome')]
})
</script>