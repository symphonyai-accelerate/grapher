branch = $(shell git symbolic-ref --short -q HEAD)
commit = $(shell git rev-parse -q HEAD)

ifneq ($(strip $(branch)),)
	isbranch = yes
else
	isbranch = no
endif

all: grapher.js grapher-min.js doc

test: grapher.js
	@npm test

doc: grapher.js
	@npm run doc

grapher.js:
	@npm run grapher.js

grapher-min.js: grapher.js
	@npm run grapher-min.js

gh-pages: grapher.js grapher-min.js doc

# create a temporary branch and commit any changes
	@git checkout -b temp-$(commit)
	-git add .
	-git commit -a -m "make"

# update gh-pages with the new build, examples, and docs
	@git checkout gh-pages
	@git checkout temp-$(commit) -- build
	@git checkout temp-$(commit) -- examples
	@git checkout temp-$(commit) -- doc

# copy the doc folder to the index and cleanup
	@cp -R doc/. .
	@rm -rf doc

# create a new gh-pages branch and commit these changes
# this should be easy to arc diff or merge into gh-pages
	@git checkout -b gh-pages-$(commit)
	-git add .
	-git commit -a -q -m "make gh-pages from $(commit)"

# soft reset the changes from temp, and delete the temp branch
	@git checkout temp-$(commit)
	@git reset --soft $(commit)
ifeq ($(isbranch), yes) # we make a branch check here to avoid detaching the HEAD
	@git checkout $(branch)
else
	@git checkout $(commit)
endif
	@git branch -D temp-$(commit)
