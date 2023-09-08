import './App.css'
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css"
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator
} from "@chatscope/chat-ui-kit-react"
import React from 'react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {dark} from 'react-syntax-highlighter/dist/esm/styles/prism'

const apiKey = process.env.REACT_APP_GPT_API_KEY

function App() {
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState([
    {
      message: "ReactGTP at your service, how can I help...",
      sender: "ChatGPT"
    }
  ])

  // sends user's message to chatgpt
  const handleSend = async (message) => {
    const newMessage = {
      message: message,
      sender: "user",
      direction: "outgoing"
    }

    const newMessages = [...messages, newMessage]
    setMessages(newMessages)

    setTyping(true)

    processMessageToChatGPT(newMessages)
  }

  async function processMessageToChatGPT(chatMessages){
    // chatScope { 
    //   sender: "user" or "ChatGPT,
    //   message: "message content here"
    // }
    // chatGPT-APIMessages { 
    //  role: "user" or "assistant"
    //  content: "message content here"
    // }
    let apiMessages = chatMessages.map((messageObject) => {
      let role = "";
      role = messageObject.sender === "ChatGPT" ? "assistant" : "user"  
      return { role: role, content: messageObject.message}
    })

    const systemMessage = {
      role: "system",
      content: "explain everything with 1 coded example of a React component"
    }

    const apiRequestBody = {
      "model": "gpt-3.5-turbo",
      "messages" : [
        systemMessage,
        ...apiMessages
      ]
    }

    await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiRequestBody)
    }).then((data) => {
      return data.json()
    }).then((data) => {
      console.log(data.choices[0].message.content)
      setMessages(
        [...chatMessages, {
          message: data.choices[0].message.content,
          sender: "ChatGPT",
          direction: "incoming"
        }]
      )
      setTyping(false)
    })
  }

  return (
    <div className="App">
      <div style={{ position: "relative", height: "800px", width: "50%"}}>
        <MainContainer>
          <ChatContainer>
            <MessageList
              scrollBehavior='smooth' 
              typingIndicator={typing ? <TypingIndicator content="ChatGPT is typing..." /> : null}
            >
              {messages.map((messageObject, i) => {
                //return <Message key={i} model={message}/>
                return (
                  <Message 
                    key={i}
                    model={{
                      direction: messageObject.direction,
                      sender: messageObject.sender,
                      type: "custom"
                    }}
                  >
                    <Message.CustomContent>
                      <ReactMarkdown
                        children={messageObject.message} 
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '') // = ["language-jsx, "jsx"]
                            return !inline && match ? (
                              <SyntaxHighlighter
                                {...props}
                                children={String(children).replace(/\n$/, '')}
                                style={dark}
                                language={match[1]}
                                PreTag="div"
                              />
                            ) : (
                              <code {...props} className={className}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      />
                    </Message.CustomContent>
                  </Message>
                )
              })}
            </MessageList>
            <MessageInput placeholder='Ask React question here' onSend={handleSend}/>
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}

export default App;
