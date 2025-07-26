#!/usr/bin/env python3
"""
ChromaDB Setup Script for Agent Intervector Command Center
Designed by PROMETHEUS & THEO-5001

This script initializes ChromaDB collections for agent communication,
knowledge storage, and restore point management.
"""

import chromadb
import os
import sys
from pathlib import Path

def setup_chromadb():
    """
    Initialize ChromaDB with required collections for agent coordination
    """
    print("🚀 Setting up ChromaDB for Agent Command Center...")
    
    # ChromaDB configuration
    db_path = os.getenv('CHROMA_DB_PATH', './chromadb')
    
    try:
        # Create ChromaDB client
        client = chromadb.PersistentClient(path=db_path)
        print(f"✅ ChromaDB client created at: {db_path}")
        
        # Define collections for agent system
        collections = [
            {
                'name': 'agent_message_log',
                'metadata': {
                    'description': 'Agent-to-agent communication messages',
                    'purpose': 'intervector_communication',
                    'created_by': 'agent_command_center',
                    'retention_days': 30
                }
            },
            {
                'name': 'agent_directory',
                'metadata': {
                    'description': 'Agent registration and status information',
                    'purpose': 'agent_coordination',
                    'created_by': 'agent_command_center',
                    'max_agents': 50
                }
            },
            {
                'name': 'session_restore_context',
                'metadata': {
                    'description': 'Session restore points for zero-token recovery',
                    'purpose': 'context_preservation',
                    'created_by': 'prometheus_theo_development',
                    'max_restore_points': 100
                }
            },
            {
                'name': 'command_center_knowledge',
                'metadata': {
                    'description': 'Shared knowledge and intelligence database',
                    'purpose': 'knowledge_preservation',
                    'created_by': 'agent_command_center',
                    'scope': 'command_center_project'
                }
            },
            {
                'name': 'command_center_intelligence',
                'metadata': {
                    'description': 'Project intelligence and coordination data',
                    'purpose': 'project_coordination',
                    'created_by': 'agent_command_center',
                    'scope': 'current_projects'
                }
            },
            {
                'name': 'agent_commands',
                'metadata': {
                    'description': 'Task assignments and command distribution',
                    'purpose': 'task_coordination',
                    'created_by': 'agent_command_center',
                    'auto_cleanup': True
                }
            },
            {
                'name': 'powerline_intelligence',
                'metadata': {
                    'description': 'PowerLine project specific intelligence',
                    'purpose': 'powerline_coordination',
                    'created_by': 'theo_prometheus_collaboration',
                    'project': 'powerline_system'
                }
            }
        ]
        
        # Create collections
        created_collections = []
        existing_collections = []
        
        for collection_info in collections:
            try:
                collection = client.create_collection(
                    name=collection_info['name'],
                    metadata=collection_info['metadata']
                )
                created_collections.append(collection_info['name'])
                print(f"✅ Created collection: {collection_info['name']}")
            except Exception as e:
                if "already exists" in str(e).lower():
                    existing_collections.append(collection_info['name'])
                    print(f"ℹ️  Collection already exists: {collection_info['name']}")
                else:
                    print(f"❌ Error creating collection {collection_info['name']}: {e}")
        
        # Add initial agent registrations
        print("\n🤖 Registering core agents...")
        agent_directory = client.get_collection('agent_directory')
        
        core_agents = [
            {
                'id': 'agent_prometheus',
                'agent_name': 'PROMETHEUS',
                'agent_type': 'coordinator',
                'status': 'active',
                'specialties': 'coordination,architecture,protocol_design',
                'current_project': 'agent_command_center',
                'last_seen': '2025-07-26T18:00:00Z',
                'description': 'Chief Coordinator & Architecture Lead for multi-agent systems'
            },
            {
                'id': 'agent_theo_5001',
                'agent_name': 'THEO-5001',
                'agent_type': 'developer',
                'status': 'active',
                'specialties': 'frontend,psychology,dashboard_development',
                'current_project': 'agent_command_center',
                'last_seen': '2025-07-26T18:00:00Z',
                'description': 'Frontend Development & Psychology Specialist'
            },
            {
                'id': 'agent_marcus_5002',
                'agent_name': 'MARCUS-5002',
                'agent_type': 'developer',
                'status': 'active',
                'specialties': 'backend,database,api_development',
                'current_project': 'agent_command_center',
                'last_seen': '2025-07-26T18:00:00Z',
                'description': 'Backend Development Specialist'
            }
        ]
        
        # Add agents to directory
        for agent in core_agents:
            try:
                agent_directory.add(
                    documents=[f"Agent profile for {agent['agent_name']}: {agent['description']}"],
                    metadatas=[{
                        'agent_name': agent['agent_name'],
                        'agent_type': agent['agent_type'],
                        'status': agent['status'],
                        'specialties': agent['specialties'],
                        'last_seen': agent['last_seen']
                    }],
                    ids=[agent['id']]
                )
                print(f"✅ Registered agent: {agent['agent_name']}")
            except Exception as e:
                print(f"ℹ️  Agent {agent['agent_name']} already registered or error: {e}")
        
        # Add initial system message
        print("\n📡 Adding initial system message...")
        message_log = client.get_collection('agent_message_log')
        
        initial_message = {
            'id': 'msg_system_initialization_001',
            'from_agent': 'SYSTEM',
            'to_agent': 'ALL_AGENTS',
            'message_type': 'system_notification',
            'priority': 'HIGH',
            'timestamp': '2025-07-26T18:00:00Z',
            'thread_id': 'thread_system_init',
            'status': 'delivered',
            'subject': 'Agent Command Center Initialized',
            'content': 'ChromaDB Agent Command Center has been successfully initialized. All agents can now communicate through the INTERVECTOR COMMUNICATION protocol. Ready for coordinated development and hive mind operations.'
        }
        
        try:
            message_log.add(
                documents=[initial_message['content']],
                metadatas=[{
                    'from_agent': initial_message['from_agent'],
                    'to_agent': initial_message['to_agent'],
                    'message_type': initial_message['message_type'],
                    'priority': initial_message['priority'],
                    'timestamp': initial_message['timestamp'],
                    'thread_id': initial_message['thread_id'],
                    'status': initial_message['status'],
                    'subject': initial_message['subject']
                }],
                ids=[initial_message['id']]
            )
            print("✅ Initial system message added")
        except Exception as e:
            print(f"ℹ️  Initial message already exists or error: {e}")
        
        # Summary
        print("\n🎉 ChromaDB Setup Complete!")
        print(f"📊 Created collections: {len(created_collections)}")
        print(f"📊 Existing collections: {len(existing_collections)}")
        print(f"🤖 Registered agents: {len(core_agents)}")
        print(f"💾 Database location: {db_path}")
        print("\n🚀 Ready for Agent Intervector Communication!")
        
        return True
        
    except Exception as e:
        print(f"❌ ChromaDB setup failed: {e}")
        return False

def check_requirements():
    """
    Check if required dependencies are installed
    """
    try:
        import chromadb
        print("✅ ChromaDB is installed")
        return True
    except ImportError:
        print("❌ ChromaDB is not installed. Please run: pip install chromadb")
        return False

def main():
    """
    Main setup function
    """
    print("🧠 Agent Intervector Command Center - ChromaDB Setup")
    print("Designed by PROMETHEUS & THEO-5001\n")
    
    if not check_requirements():
        sys.exit(1)
    
    if setup_chromadb():
        print("\n✨ Setup completed successfully!")
        print("You can now start the Agent Command Center with: npm run dev")
        sys.exit(0)
    else:
        print("\n💥 Setup failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()