import os
import glob
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Use a local embedding model for the RAG documents to save API calls, 
# and use Gemini for the generative part.
# Alternatively, could use GoogleGenerativeAIEmbeddings.

class PolarisRAGAssistant:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.vector_store = None
        self.retriever = None
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",
            temperature=0.3,
            convert_system_message_to_human=True
        )
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.init_rag()

    def init_rag(self):
        """Initializes the RAG system by loading docs and creating a vector store."""
        # Check if vector store exists locally (chroma_db)
        if os.path.exists("./chroma_db"):
            self.vector_store = Chroma(
                persist_directory="./chroma_db", 
                embedding_function=self.embeddings
            )
            print("Loaded existing ChromaDB vector store.")
        else:
            self._build_vector_store()
            
        if self.vector_store:
            self.retriever = self.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 3}
            )

    def _build_vector_store(self):
        """Loads documents from data directory and builds vector store."""
        documents = []
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
            
        print(f"Loading documents from {self.data_dir}...")
        
        # Load PDFs
        for file_path in glob.glob(f"{self.data_dir}/*.pdf"):
            loader = PyPDFLoader(file_path)
            documents.extend(loader.load())
            
        # Load text files
        for file_path in glob.glob(f"{self.data_dir}/*.txt"):
            loader = TextLoader(file_path)
            documents.extend(loader.load())
            
        if not documents:
            print(f"No documents found in {self.data_dir}. Please add research papers/txt files.")
            # Let's create a sample document if none exists
            sample_text = "The 41st Indian Scientific Expedition to Antarctica highlighted severe ice-shelf melting. The average temperature anomaly was +1.2C, and the primary cause was identified as warmer ocean currents under the ice shelves."
            with open(f"{self.data_dir}/sample_report.txt", "w") as f:
                f.write(sample_text)
            loader = TextLoader(f"{self.data_dir}/sample_report.txt")
            documents.extend(loader.load())

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        splits = text_splitter.split_documents(documents)
        
        print(f"Creating vector store from {len(splits)} chunks...")
        self.vector_store = Chroma.from_documents(
            documents=splits, 
            embedding=self.embeddings,
            persist_directory="./chroma_db"
        )
        print("Vector store created successfully.")

    def _format_docs(self, docs):
        """Formats the retrieved documents to provide content and source."""
        formatted_docs = []
        for d in docs:
            source = d.metadata.get('source', 'Unknown Document')
            page = d.metadata.get('page', '')
            page_str = f", Page {page}" if page else ""
            formatted_docs.append(f"Content: {d.page_content}\nSource: {source}{page_str}\n")
        return "\n\n".join(formatted_docs)

    def ask(self, query: str):
        """Handles the user query and returns a RAG-based answer."""
        if not self.retriever:
            return {"answer": "Error: Vector store not initialized.", "sources": []}

        # Retrieve relevant docs
        retrieved_docs = self.retriever.invoke(query)
        
        template = """You are Polaris AI, an expert research assistant for the Indian Polar Science Portal (Smart India Hackathon 2026).
Your goal is to answer questions about polar research accurately based on the provided context.
If the answer is not in the context, say "I cannot find the answer to this question in the current research repository." Do not make up information.
Always cite your sources if you use them. Make the response conversational yet academic.

Context from the repository:
{context}

User Question: {question}

Answer:"""
        
        prompt = ChatPromptTemplate.from_template(template)
        
        rag_chain = (
            {"context": lambda x: self._format_docs(retrieved_docs), "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )
        
        answer = rag_chain.invoke(query)
        
        # Extract unique sources to send back
        sources = []
        for doc in retrieved_docs:
            source_info = doc.metadata.get('source', 'Unknown')
            page_info = doc.metadata.get('page', '')
            source_entry = f"{source_info} (Page {page_info})" if page_info else source_info
            if source_entry not in sources:
                sources.append(source_entry)
                
        return {
            "query": query,
            "answer": answer,
            "sources": sources
        }
