#ifndef _LARGEFILE64_SOURCE
#define _LARGEFILE64_SOURCE
#endif

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/syscalls.h>
#include <linux/file.h>
#include <linux/fs.h>
#include <linux/string.h>
#include <linux/mm.h>
#include <linux/sched.h>
#include <linux/unistd.h>
#include <asm/pgtable.h>
#include <asm/uaccess.h>
#include <asm/ptrace.h>

/*
** module macros
*/
MODULE_LICENSE("GPL");
MODULE_AUTHOR("infosec-sjtu");
MODULE_DESCRIPTION("hook sys_call_table");

typedef void (*demo_sys_call_ptr_t)(void);
typedef asmlinkage long (*orig_openat_t)(struct pt_regs *regs);
typedef asmlinkage long (*orig_read_t)(struct pt_regs *regs);
typedef asmlinkage long (*orig_write_t)(struct pt_regs *regs);

demo_sys_call_ptr_t *get_sys_call_table(void);

int AuditOpenat(struct pt_regs *, char *pathname, int ret);
int AuditWrite(struct pt_regs *, int ret);

void netlink_release(void);
void netlink_init(void);

demo_sys_call_ptr_t *sys_call_table = NULL;
orig_openat_t orig_openat = NULL;
orig_write_t orig_write = NULL;

unsigned int level;
pte_t *pte;

asmlinkage long hacked_openat(struct pt_regs *regs)
{

	long ret;
	char buffer[PATH_MAX];
	long nbytes;

	nbytes = strncpy_from_user(buffer, (char *)regs->bx, PATH_MAX);

	// printk("info:   hooked sys_openat(), file name:%s(%ld bytes)",buffer,nbytes);

	ret = orig_openat(regs);

	AuditOpenat(regs, buffer, ret);

	return ret;
}

asmlinkage long hacked_write(struct pt_regs *regs)
{

	long ret;
	// char buffer[path_max];
	// long nbytes;

	// nbytes=strncpy_from_user(buffer,(char*)regs->bx,path_max);

	ret = orig_write(regs);

	AuditWrite(regs, ret);

	return ret;
}

static int __init audit_init(void)
{

	sys_call_table = get_sys_call_table();
	printk("Info: sys_call_table found at %lx\n", (unsigned long)sys_call_table);

	// Hook Sys Call Openat
	orig_openat = (orig_openat_t)sys_call_table[__NR_openat];
	printk("Info:  orginal openat:%lx\n", (long)orig_openat);

	// hook syscall write
	orig_write = (orig_write_t)sys_call_table[__NR_write];
	printk("Info:  orginal write:%lx\n", (long)orig_write);

	pte = lookup_address((unsigned long)sys_call_table, &level);
	// Change PTE to allow writing
	set_pte_atomic(pte, pte_mkwrite(*pte));
	printk("Info: Disable write-protection of page with sys_call_table\n");

	sys_call_table[__NR_openat] = (demo_sys_call_ptr_t)hacked_openat;

	sys_call_table[__NR_write] = (demo_sys_call_ptr_t)hacked_write;

	set_pte_atomic(pte, pte_clear_flags(*pte, _PAGE_RW));
	printk("Info: sys_call_table hooked!\n");

	netlink_init();
	return 0;
}

static void __exit audit_exit(void)
{

	pte = lookup_address((unsigned long)sys_call_table, &level);
	set_pte_atomic(pte, pte_mkwrite(*pte));

	sys_call_table[__NR_openat] = (demo_sys_call_ptr_t)orig_openat;

	set_pte_atomic(pte, pte_clear_flags(*pte, _PAGE_RW));

	netlink_release();
}

module_init(audit_init);
module_exit(audit_exit);
