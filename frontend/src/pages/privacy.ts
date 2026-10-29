export function renderPrivacy(app: HTMLElement) {
    app.innerHTML = `
    <div id="page-privacy" class="
        grid place-items-center p-[1rem]

        sp:min-h-[calc(100vh-4rem)]
        st:min-h-[100vh]
        sc:min-h-[calc(100vh-4rem)]

        animate-page-in
    ">

        <section class="
            w-[min(48rem,100%)]
            card rounded-[2rem]
            backdrop-blur-xl bg-[#FFF]/10
            border-[#FFF]/25 border-[0.125rem]
            p-[1.5rem]
            flex flex-col gap-[1.5rem]
        ">
            <h1 class="title text-center">Privacy Policy</h1>
            <p><strong>Last updated:</strong> 12 12 2025</p>

            <p>
                This Privacy Policy explains how we collect, use, store, and protect personal information 
                when you use our web application Transcendance (the “Service”). By accessing or using the Service, you 
                agree to the practices described in this Privacy Policy. If you do not agree with this Policy, 
                you should not use the Service.
            </p>

            <h2 class="soft-title mt-[1rem]">TABLE OF CONTENTS</h2>
            <ul class="list-disc ml-6 space-y-1">
                <li>1.INFORMATION WE COLLECT</li>
                <li>2.HOW WE USE YOUR INFORMATION</li>
                <li>3.LEGAL BASIS FOR PROCESSING</li>
                <li>4.HOW WE SHARE INFORMATION</li>
                <li>5.DATA RETENTION</li>
                <li>6.DATA SECURITY</li>
                <li>7.COOKIES & TRACKING</li>
                <li>8.YOUR RIGHTS</li>
                <li>9.INTERNATIONAL USERS</li>
                <li>10.CHILDRENS'S PRIVACY</li>
                <li>11.CHANGES TO THIS POLICY</li>
                <li>12.CONTACT US</li>
            </ul>

            <h2 class="soft-title mt-[1rem]">1. Information We Collect</h2>
            <p>We collect the following categories of data in order to provide and improve our Service:</p>

            <h3 class="font-semibold text-[1.25rem]">1.1 Account Information</h3>
            <ul class="list-disc ml-6 space-y-1">
                <li>Email address</li>
                <li>Username</li>
                <li>Password (securely hashed)</li>
            </ul>

            <h3 class="font-semibold text-[1.25rem]">1.2 User Profile and Social Features</h3>
            <ul class="list-disc ml-6 space-y-1">
                <li>Public profile (username, avatar)</li>
                <li>Friends list & preferences</li>
                <li>Chat messages & interactions</li>
            </ul>

            <h3 class="font-semibold text-[1.25rem]">1.3 Game-Related Data</h3>
            <ul class="list-disc ml-6 space-y-1">
                <li>Match results</li>
                <li>Game performance data (scores, ranking, history)</li>
                <li>Spectator/player session metadata</li>
            </ul>

            <h3 class="font-semibold text-[1.25rem]">1.4 Technical and Usage Data</h3>
            <ul class="list-disc ml-6 space-y-1">
                <li>IP address</li>
                <li>Browser & device information</li>
                <li>Cookies and tracking technologies</li>
                <li>Application logs</li>
                <li>Real-time connection events</li>
            </ul>
            <p>We do not collect precise geolocation data.</p>

            <h2 class="soft-title mt-[1rem]">2. How We Use Your Information</h2>

            <h3 class="font-semibold text-[1.25rem]">2.1 Core Functionality</h3>
            <ul class="list-disc ml-6 space-y-1">
                <li>Account creation & management</li>
                <li>User authentication</li>
                <li>Real-time gameplay & communication</li>
                <li>Friends system and matchmaking</li>
                <li>Chat features</li>
            </ul>

            <h3 class="font-semibold text-[1.25rem]">2.2 Game Features</h3>
            <ul class="list-disc ml-6 space-y-1">
                <li>Score/ranking calculation</li>
                <li>Match history display</li>
                <li>Spectator mode</li>
            </ul>

            <h3 class="font-semibold text-[1.25rem]">2.3 Security & Compliance</h3>
            <ul class="list-disc ml-6 space-y-1">
                <li>Fraud prevention</li>
                <li>Suspicious activity monitoring</li>
                <li>Compliance with legal obligations</li>
            </ul>

            <h3 class="font-semibold text-[1.25rem]">2.4 Analytics & Performance</h3>
            <ul class="list-disc ml-6 space-y-1">
                <li>Usage analysis</li>
                <li>Performance optimization</li>
                <li>Debugging and stability improvements</li>
            </ul>

            <p>We do not sell or rent personal data.</p>

            <h2 class="soft-title mt-[1rem]">3. Legal Basis for Processing</h2>
            <ul class="list-disc ml-6 space-y-1">
                <li><strong>Contractual necessity</strong></li>
                <li><strong>Legitimate interest</strong></li>
                <li><strong>Consent</strong> (where required)</li>
            </ul>

            <h2 class="soft-title mt-[1rem]">4. How We Share Information</h2>

            <h3 class="font-semibold text-[1.25rem]">4.1 Service Providers</h3>
            <p>We may use hosting, database, real-time communication, and analytics providers.</p>

            <h3 class="font-semibold text-[1.25rem]">4.2 Other Users</h3>
            <ul class="list-disc ml-6 space-y-1">
                <li>Username</li>
                <li>Avatar</li>
                <li>Online status</li>
                <li>Game stats & history</li>
                <li>Chat messages</li>
            </ul>

            <h3 class="font-semibold text-[1.25rem]">4.3 Legal Requirements</h3>
            <p>We may disclose information when required by law.</p>

            <h2 class="soft-title mt-[1rem]">5. Data Retention</h2>
            <ul class="list-disc ml-6 space-y-1">
                <li>Account data: until deletion request</li>
                <li>Game stats: lifetime of the account</li>
                <li>Chat messages: retained as needed</li>
                <li>Logs: temporary</li>
            </ul>

            <h2 class="soft-title mt-[1rem]">6. Data Security</h2>
            <ul class="list-disc ml-6 space-y-1">
                <li>Hashed passwords</li>
                <li>HTTPS encryption</li>
                <li>Access control</li>
                <li>Behavior monitoring</li>
            </ul>

            <h2 class="soft-title mt-[1rem]">7. Cookies & Tracking</h2>
            <p>Used for authentication, performance, and real-time features.</p>

            <h2 class="soft-title mt-[1rem]">8. Your Rights</h2>
            <ul class="list-disc ml-6 space-y-1">
                <li>Access your data</li>
                <li>Request corrections</li>
                <li>Request deletion</li>
                <li>Export your data</li>
                <li>Withdraw consent</li>
            </ul>

            <h2 class="soft-title mt-[1rem]">9. International Users</h2>
            <p>Your data may be transferred internationally with adequate protection.</p>

            <h2 class="soft-title mt-[1rem]">10. Children’s Privacy</h2>
            <p>The Service is not intended for minors.</p>

            <h2 class="soft-title mt-[1rem]">11. Changes to This Policy</h2>
            <p>We may update the Policy; continued use means acceptance.</p>

            <h2 class="soft-title mt-[1rem]">12. Contact Us</h2>
            <p>
                
                If you have any further questions or comments, you can contact us at:<br/>
                Location:<strong>42 Mulhouse</strong><br/>
                Email: <strong> epasseri@student.42mulhouse.fr</strong><br/>
            </p>
        </section>

    </div>`;
}
