let localStream;
let peerConnection;
let peerIndex = 0;
const peerIds = ['peer1', 'peer2', 'peer3']; // Example list of peer IDs

// Define your WebSocket URL
const signalingServerUrl = 'wss://your-signaling-server.com';

// Create a WebSocket connection
const socket = new WebSocket(signalingServerUrl);

// WebSocket event listener for errors
socket.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
});

// WebSocket event listener for messages
socket.addEventListener('message', (event) => {
    console.log('Message received from signaling server:', event.data);
    // Handle messages received from the signaling server if needed
});

const startCallButton = document.getElementById('startCall');
const endCallButton = document.getElementById('endCall');
const nextPeerButton = document.getElementById('nextPeer');
const muteMicrophoneButton = document.getElementById('muteMicrophone');

startCallButton.addEventListener('click', startCall);
endCallButton.addEventListener('click', endCall);
nextPeerButton.addEventListener('click', nextPeer);
muteMicrophoneButton.addEventListener('click', toggleMuteMicrophone);

function startCall() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
            localStream = stream;
            const audioTracks = stream.getAudioTracks();
            peerConnection = new RTCPeerConnection();

            // Add local audio stream to peer connection
            audioTracks.forEach(track => peerConnection.addTrack(track, localStream));

            // Event listener for remote tracks
            peerConnection.ontrack = event => {
                const remoteStream = event.streams[0];
                // Handle remote audio/video streams
            };

            // Event listener for ICE candidates
            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    // Send ICE candidate to remote peer through WebSocket
                    const iceCandidateMessage = {
                        type: 'ice',
                        peerId: peerIds[peerIndex],
                        candidate: event.candidate
                    };
                    socket.send(JSON.stringify(iceCandidateMessage));
                }
            };

            // Create offer
            peerConnection.createOffer()
                .then(offer => peerConnection.setLocalDescription(offer))
                .then(() => {
                    // Send offer to remote peer through WebSocket
                    const offerMessage = {
                        type: 'offer',
                        peerId: peerIds[peerIndex],
                        offer: peerConnection.localDescription
                    };
                    socket.send(JSON.stringify(offerMessage));
                })
                .catch(error => {
                    console.error('Error creating offer:', error);
                });

            // Show relevant buttons
            startCallButton.style.display = 'none';
            endCallButton.style.display = 'block';
            nextPeerButton.style.display = 'block';
            muteMicrophoneButton.style.display = 'block';
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
        });
}

function endCall() {
    // Close peer connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    // Stop local audio stream
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    // Reset button display
    startCallButton.style.display = 'block';
    endCallButton.style.display = 'none';
    nextPeerButton.style.display = 'none';
    muteMicrophoneButton.style.display = 'none';
}

function nextPeer() {
    if (peerConnection) {
        endCall(); // End current call before connecting to the next peer
    }

    // Connect to the next peer in the list
    if (peerIndex < peerIds.length) {
        const nextPeerId = peerIds[peerIndex];
        connectToPeer(nextPeerId);
        peerIndex++;
    } else {
        console.log('No more peers to connect to.');
    }
}

function connectToPeer(peerId) {
    // Create a new RTCPeerConnection
    const newPeerConnection = new RTCPeerConnection();

    // Add local stream to the new peer connection
    localStream.getTracks().forEach(track => newPeerConnection.addTrack(track, localStream));

    // Event listener for remote tracks
    newPeerConnection.ontrack = event => {
        const remoteStream = event.streams[0];
        // Handle remote audio/video streams
    };

    // Event listener for ICE candidates
    newPeerConnection.onicecandidate = event => {
        if (event.candidate) {
            // Send ICE candidate to remote peer through WebSocket
            const iceCandidateMessage = {
                type: 'ice',
                peerId: peerId,
                candidate: event.candidate
            };
            socket.send(JSON.stringify(iceCandidateMessage));
        }
    };

    // Save the new peer connection
    peerConnections.set(peerId, newPeerConnection);

    // Create offer
    newPeerConnection.createOffer()
        .then(offer => newPeerConnection.setLocalDescription(offer))
        .then(() => {
            // Send offer to remote peer through WebSocket
            const offerMessage = {
                type: 'offer',
                peerId: peerId,
                offer: newPeerConnection.localDescription
            };
            socket.send(JSON.stringify(offerMessage));
        })
        .catch(error => {
            console.error('Error creating offer:', error);
        });
}

function toggleMuteMicrophone() {
    if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
            if (track.enabled) {
                muteMicrophoneButton.innerText = 'Mute Microphone';
            } else {
                muteMicrophoneButton.innerText = 'Unmute Microphone';
            }
        });
    }
}
